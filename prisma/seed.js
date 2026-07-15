const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const incomeCategories = [
  { id: 'salary', name: 'Salary', type: 'INCOME', color: '#10b981', icon: 'Briefcase' },
  { id: 'business', name: 'Business', type: 'INCOME', color: '#6366f1', icon: 'Store' },
  { id: 'freelance', name: 'Freelance', type: 'INCOME', color: '#f59e0b', icon: 'Laptop' },
  { id: 'rental', name: 'Rental Income', type: 'INCOME', color: '#06b6d4', icon: 'Home' },
  { id: 'interest', name: 'Interest', type: 'INCOME', color: '#3b82f6', icon: 'Percent' },
  { id: 'gift_inc', name: 'Gift (Income)', type: 'INCOME', color: '#ec4899', icon: 'Gift' },
  { id: 'cashback', name: 'Cashback', type: 'INCOME', color: '#14b8a6', icon: 'DollarSign' },
  { id: 'refund', name: 'Refund', type: 'INCOME', color: '#6b7280', icon: 'RotateCcw' },
  { id: 'bonus', name: 'Bonus', type: 'INCOME', color: '#eab308', icon: 'Award' },
  { id: 'other_inc', name: 'Other Income', type: 'INCOME', color: '#9ca3af', icon: 'PlusCircle' }
];

const expenseCategories = [
  { id: 'food', name: 'Food', type: 'EXPENSE', color: '#f59e0b', icon: 'Utensils' },
  { id: 'grocery', name: 'Grocery', type: 'EXPENSE', color: '#10b981', icon: 'ShoppingBag' },
  { id: 'rent', name: 'Rent', type: 'EXPENSE', color: '#ef4444', icon: 'Home' },
  { id: 'emi', name: 'EMI', type: 'EXPENSE', color: '#8b5cf6', icon: 'CalendarDays' },
  { id: 'electricity', name: 'Electricity', type: 'EXPENSE', color: '#eab308', icon: 'Zap' },
  { id: 'water', name: 'Water', type: 'EXPENSE', color: '#3b82f6', icon: 'Droplet' },
  { id: 'internet', name: 'Internet', type: 'EXPENSE', color: '#06b6d4', icon: 'Wifi' },
  { id: 'mobile_recharge', name: 'Mobile Recharge', type: 'EXPENSE', color: '#a855f7', icon: 'Smartphone' },
  { id: 'fuel', name: 'Fuel', type: 'EXPENSE', color: '#f97316', icon: 'Fuel' },
  { id: 'transport', name: 'Transport', type: 'EXPENSE', color: '#6366f1', icon: 'Bus' },
  { id: 'cab', name: 'Cab', type: 'EXPENSE', color: '#ec4899', icon: 'Car' },
  { id: 'shopping', name: 'Shopping', type: 'EXPENSE', color: '#d946ef', icon: 'ShoppingCart' },
  { id: 'entertainment', name: 'Entertainment', type: 'EXPENSE', color: '#84cc16', icon: 'Film' },
  { id: 'healthcare', name: 'Healthcare', type: 'EXPENSE', color: '#f43f5e', icon: 'HeartPulse' },
  { id: 'education', name: 'Education', type: 'EXPENSE', color: '#06b6d4', icon: 'GraduationCap' },
  { id: 'travel', name: 'Travel', type: 'EXPENSE', color: '#14b8a6', icon: 'Plane' },
  { id: 'insurance', name: 'Insurance', type: 'EXPENSE', color: '#06b6d4', icon: 'ShieldAlert' },
  { id: 'taxes', name: 'Taxes', type: 'EXPENSE', color: '#6b7280', icon: 'FileText' },
  { id: 'investments', name: 'Investments', type: 'EXPENSE', color: '#10b981', icon: 'TrendingUp' },
  { id: 'gifts', name: 'Gifts', type: 'EXPENSE', color: '#ec4899', icon: 'Gift' },
  { id: 'donations', name: 'Donations', type: 'EXPENSE', color: '#f43f5e', icon: 'Heart' },
  { id: 'pets', name: 'Pets', type: 'EXPENSE', color: '#b45309', icon: 'Dog' },
  { id: 'other_exp', name: 'Other Expense', type: 'EXPENSE', color: '#6b7280', icon: 'CreditCard' }
];

const categories = [...incomeCategories, ...expenseCategories];

async function main() {
  console.log('Clearing database...');
  await prisma.recurringTransaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  console.log('Seeding categories...');
  for (const cat of categories) {
    await prisma.category.create({ data: cat });
  }

  console.log('Creating default user with INR currency...');
  const user = await prisma.user.create({
    data: {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      currency: 'INR',
      timeZone: 'IST',
      language: 'en',
      theme: 'light'
    }
  });

  console.log('Creating salary and savings accounts...');
  const salaryAccount = await prisma.account.create({
    data: {
      name: 'Primary Salary Account',
      type: 'BANK',
      openingBalance: 30000,
      currentBalance: 30000, 
      userId: user.id
    }
  });

  const cash = await prisma.account.create({
    data: {
      name: 'Cash in Hand',
      type: 'CASH',
      openingBalance: 2000,
      currentBalance: 2000, 
      userId: user.id
    }
  });

  console.log('Creating recurring monthly items (Salary, Rent, EMI, Grocery)...');
  const now = new Date();
  
  // Set nextDate to 1st of CURRENT month so that it is processed as "due" immediately
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMonthFirst = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Monthly Salary (₹30,000)
  await prisma.recurringTransaction.create({
    data: {
      userId: user.id,
      amount: 30000,
      type: 'INCOME',
      frequency: 'MONTHLY',
      startDate: prevMonthDate,
      nextRunDate: currentMonthFirst,
      description: 'Monthly Salary Credit',
      categoryId: 'salary',
      accountId: salaryAccount.id
    }
  });

  // 2. Hostel Rent (₹8,000)
  await prisma.recurringTransaction.create({
    data: {
      userId: user.id,
      amount: 8000,
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      startDate: prevMonthDate,
      nextRunDate: currentMonthFirst,
      description: 'Hostel Rent Deduction',
      categoryId: 'rent',
      accountId: salaryAccount.id
    }
  });

  // 3. EMI (₹5,000)
  await prisma.recurringTransaction.create({
    data: {
      userId: user.id,
      amount: 5000,
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      startDate: prevMonthDate,
      nextRunDate: currentMonthFirst,
      description: 'Car Loan EMI',
      categoryId: 'emi',
      accountId: salaryAccount.id
    }
  });

  // 4. Grocery Allowance (₹3,000)
  await prisma.recurringTransaction.create({
    data: {
      userId: user.id,
      amount: 3000,
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      startDate: prevMonthDate,
      nextRunDate: currentMonthFirst,
      description: 'Monthly Grocery Supply',
      categoryId: 'grocery',
      accountId: salaryAccount.id
    }
  });

  console.log('Creating default budgets...');
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  await prisma.budget.create({
    data: {
      name: 'Hostel Rent Target',
      amount: 10000,
      categoryId: 'rent',
      startDate: startOfMonth,
      endDate: endOfMonth,
      alertLimit: 85,
      userId: user.id
    }
  });

  await prisma.budget.create({
    data: {
      name: 'Monthly Grocery limit',
      amount: 5000,
      categoryId: 'grocery',
      startDate: startOfMonth,
      endDate: endOfMonth,
      alertLimit: 85,
      userId: user.id
    }
  });

  console.log('Creating default savings goals...');
  await prisma.goal.createMany({
    data: [
      {
        name: 'Emergency Fund',
        targetAmount: 50000,
        currentAmount: 15000,
        deadline: new Date(now.getFullYear() + 1, now.getMonth(), 1),
        status: 'IN_PROGRESS',
        userId: user.id
      },
      {
        name: 'Buy Two Wheeler',
        targetAmount: 90000,
        currentAmount: 20000,
        deadline: new Date(now.getFullYear(), now.getMonth() + 6, 15),
        status: 'IN_PROGRESS',
        userId: user.id
      }
    ]
  });

  console.log('Creating default saved cards...');
  await prisma.card.createMany({
    data: [
      {
        name: 'HDFC Salary Debit Card',
        number: '4532718293814321',
        holderName: 'John Doe',
        expiry: '12/29',
        type: 'DEBIT',
        network: 'VISA',
        bankName: 'HDFC Bank',
        userId: user.id
      },
      {
        name: 'SBI Prime Credit Card',
        number: '5241829384728522',
        holderName: 'John Doe',
        expiry: '08/30',
        type: 'CREDIT',
        network: 'MASTERCARD',
        bankName: 'SBI Bank',
        userId: user.id
      }
    ]
  });

  console.log('Seeding process completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
