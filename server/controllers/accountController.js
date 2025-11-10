import { Account, Transaction } from '../models/Account.js';
import { USER_ROLES } from '../../shared/schema.js';

export const getAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, accountType, unit, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (req.user.role !== USER_ROLES.SUPER_USER) {
      query.unit = req.user.unit;
    } else if (unit) {
      query.unit = unit;
    }

    if (accountType) {
      query.accountType = accountType;
    }

    if (search) {
      query.$or = [
        { accountName: { $regex: search, $options: 'i' } },
        { accountNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const accounts = await Account.find(query)
      .populate('parentAccount', 'accountName')
      .sort({ accountNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Account.countDocuments(query);

    res.json({
      accounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.findById(id).populate('parentAccount', 'accountName');

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (req.user.role !== USER_ROLES.SUPER_USER && account.unit !== req.user.unit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ account });
  } catch (error) {
    console.error('Get account by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { accountName, accountType, parentAccount, description } = req.body;

    if (!accountName || !accountType) {
      return res.status(400).json({ message: 'Account name and type are required' });
    }

    // Generate account number
    const accountNumber = `ACC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const accountData = {
      accountNumber,
      accountName,
      accountType,
      unit: req.user.role === USER_ROLES.SUPER_USER ? req.body.unit : req.user.unit,
      parentAccount,
      description
    };

    const account = await Account.create(accountData);
    await account.populate('parentAccount', 'accountName');

    res.status(201).json({
      message: 'Account created successfully',
      account
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountName, accountType, parentAccount, description, isActive } = req.body;

    const account = await Account.findById(id);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (req.user.role !== USER_ROLES.SUPER_USER && account.unit !== req.user.unit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = {};
    if (accountName) updateData.accountName = accountName;
    if (accountType) updateData.accountType = accountType;
    if (parentAccount) updateData.parentAccount = parentAccount;
    if (description !== undefined) updateData.description = description;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updatedAccount = await Account.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('parentAccount', 'accountName');

    res.json({
      message: 'Account updated successfully',
      account: updatedAccount
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await Account.findById(id);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (req.user.role !== USER_ROLES.SUPER_USER && account.unit !== req.user.unit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if account has transactions
    const hasTransactions = await Transaction.findOne({
      'entries.account': id
    });

    if (hasTransactions) {
      return res.status(400).json({ message: 'Cannot delete account with existing transactions' });
    }

    await Account.findByIdAndDelete(id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, unit, search, accountId } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (req.user.role !== USER_ROLES.SUPER_USER) {
      query.unit = req.user.unit;
    } else if (unit) {
      query.unit = unit;
    }

    if (accountId) {
      query['entries.account'] = accountId;
    }

    if (search) {
      query.$or = [
        { transactionNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } }
      ];
    }

    const transactions = await Transaction.find(query)
      .populate('entries.account', 'accountName accountNumber')
      .populate('createdBy', 'fullName')
      .populate('approvedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { description, reference, entries, relatedDocument, relatedDocumentId } = req.body;

    if (!description || !entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'Description and entries are required' });
    }

    // Validate entries and calculate total
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      if (!entry.account || (entry.debit === 0 && entry.credit === 0)) {
        return res.status(400).json({ message: 'Invalid entry data' });
      }
      totalDebit += entry.debit || 0;
      totalCredit += entry.credit || 0;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ message: 'Debits and credits must balance' });
    }

    const transactionData = {
      description,
      reference,
      entries,
      totalAmount: totalDebit,
      unit: req.user.role === USER_ROLES.SUPER_USER ? req.body.unit : req.user.unit,
      relatedDocument,
      relatedDocumentId,
      createdBy: req.user._id
    };

    const transaction = await Transaction.create(transactionData);
    await transaction.populate([
      { path: 'entries.account', select: 'accountName accountNumber' },
      { path: 'createdBy', select: 'fullName' }
    ]);

    // Update account balances
    for (const entry of entries) {
      const account = await Account.findById(entry.account);
      if (account) {
        if (['Asset', 'Expense'].includes(account.accountType)) {
          account.balance += (entry.debit || 0) - (entry.credit || 0);
        } else {
          account.balance += (entry.credit || 0) - (entry.debit || 0);
        }
        await account.save();
      }
    }

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (req.user.role !== USER_ROLES.SUPER_USER && transaction.unit !== req.user.unit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (transaction.isApproved) {
      return res.status(400).json({ message: 'Transaction already approved' });
    }

    transaction.isApproved = true;
    transaction.approvedBy = req.user._id;
    await transaction.save();

    await transaction.populate([
      { path: 'entries.account', select: 'accountName accountNumber' },
      { path: 'createdBy', select: 'fullName' },
      { path: 'approvedBy', select: 'fullName' }
    ]);

    res.json({
      message: 'Transaction approved successfully',
      transaction
    });
  } catch (error) {
    console.error('Approve transaction error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
