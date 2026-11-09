'use strict';
/* বাংলা অনুবাদ. Key = exact English text used in the app. Missing keys simply show in English. */
const BN={
// navigation & titles
'Overview':'সারসংক্ষেপ','Activity':'লেনদেন','Insights':'বিশ্লেষণ','Money':'টাকা','Settings':'সেটিংস','Backup & account':'ব্যাকআপ ও অ্যাকাউন্ট',
'Account, backup and security':'অ্যাকাউন্ট, ব্যাকআপ ও নিরাপত্তা','Sections':'বিভাগ','Add transaction':'লেনদেন যোগ করুন','Add a transaction':'লেনদেন যোগ করুন',
'Edit transaction':'লেনদেন সম্পাদনা','Previous month':'আগের মাস','Next month':'পরের মাস','Previous year':'আগের বছর','Next year':'পরের বছর','Close':'বন্ধ করুন',
// home
'Back to this month':'এই মাসে ফিরুন','Spent in':'খরচ,','Income':'আয়','Balance':'ব্যালেন্স','Avg / day':'দিনে গড়','Budget left':'বাজেট বাকি','Spent':'খরচ',
'Where it went':'টাকা কোথায় গেল','tap a slice to see them':'দেখতে অংশে ট্যাপ করুন','Spending pace':'খরচের গতি','Budgets':'বাজেট','Budget':'বাজেট',
'No spending in this month yet.':'এই মাসে এখনো কোনো খরচ নেই।','Add an expense':'খরচ যোগ করুন','Set a monthly budget':'মাসিক বাজেট ঠিক করুন',
'Over budget by {x}':'বাজেটের চেয়ে {x} বেশি','{p}% of your {b} budget':'আপনার {b} বাজেটের {p}%','Hi, {n} 👋':'হ্যালো, {n} 👋',
'Nothing to show yet. Spending and category budgets appear here.':'এখনো দেখানোর কিছু নেই। খরচ ও ক্যাটাগরি বাজেট এখানে দেখা যাবে।',
'Plan for this month':'এই মাসের পরিকল্পনা','✨ Ask an AI assistant':'✨ এআই সহকারীকে জিজ্ঞাসা করুন','Ask an AI assistant':'এআই সহকারীকে জিজ্ঞাসা করুন',
'You can spend about {x} a day for the next {n} days.':'আগামী {n} দিন আপনি দিনে প্রায় {x} খরচ করতে পারবেন।',
'(after {y} of bills still due)':'({y} বিল এখনো বাকি থাকার পর)','You are {x} over your plan this month.':'এই মাসে আপনি পরিকল্পনার চেয়ে {x} বেশি খরচ করেছেন।',
'At this pace you will spend {p}, which is {d} over.':'এই গতিতে চললে মোট {p} খরচ হবে, যা {d} বেশি।',
'Based on your recent months. Set a budget in Settings for a firmer plan.':'আপনার সাম্প্রতিক মাসগুলোর ভিত্তিতে। আরও নির্ভুল পরিকল্পনার জন্য সেটিংসে বাজেট দিন।',
'Set a monthly budget and Spendly will tell you how much you can spend each day.':'মাসিক বাজেট দিন, Spendly বলে দেবে প্রতিদিন কত খরচ করতে পারবেন।','Set budget':'বাজেট দিন',
'Try to set aside {x} this month. So far: {y}.':'এই মাসে {x} সঞ্চয় করার চেষ্টা করুন। এখন পর্যন্ত: {y}।','Your goals need about {g} a month.':'আপনার লক্ষ্যগুলোর জন্য মাসে প্রায় {g} লাগবে।',
// activity
'This month':'এই মাস','All time':'সব সময়','Search notes, categories, wallets':'নোট, ক্যাটাগরি, ওয়ালেট খুঁজুন','All types':'সব ধরন','Expenses':'খরচ','Transfers':'ট্রান্সফার',
'All categories':'সব ক্যাটাগরি','All wallets':'সব ওয়ালেট','{n} item':'{n}টি','{n} items':'{n}টি','spent {x}':'খরচ {x}','income {x}':'আয় {x}','clear filters':'ফিল্টার মুছুন',
'Nothing matches these filters.':'এই ফিল্টারে কিছু মেলেনি।','No transactions yet.':'এখনো কোনো লেনদেন নেই।','Show {n} more':'আরও {n}টি দেখুন','Repeating':'পুনরাবৃত্ত','Receipt':'রসিদ',
// insights
'Income vs expenses':'আয় বনাম খরচ','6 mo':'৬ মাস','12 mo':'১২ মাস','Tap a bar to open that month.':'মাস খুলতে বারে ট্যাপ করুন।','Top categories':'শীর্ষ ক্যাটাগরি',
'Month by month':'মাস অনুযায়ী','Avg / month':'মাসে গড়','selected':'নির্বাচিত','No spending recorded in {y}.':'{y} সালে কোনো খরচ নেই।','No months with data in {y}.':'{y} সালে কোনো তথ্য নেই।',
'Share PDF report':'পিডিএফ রিপোর্ট শেয়ার করুন','Preparing…':'তৈরি হচ্ছে…','Could not create the report.':'রিপোর্ট তৈরি করা যায়নি।','Spending report':'খরচের রিপোর্ট',
'Spending by category':'ক্যাটাগরি অনুযায়ী খরচ','All transactions':'সব লেনদেন','Date':'তারিখ','Category':'ক্যাটাগরি','Note':'নোট','Amount':'পরিমাণ','Made with Spendly':'Spendly দিয়ে তৈরি',
// money tab
'Total balance':'মোট ব্যালেন্স','+ Wallet':'+ ওয়ালেট','⇄ Transfer':'⇄ ট্রান্সফার','+ New':'+ নতুন','Savings goals':'সঞ্চয়ের লক্ষ্য','Loans & debts':'ধার ও দেনা',
'{n} wallet · shown in {c}':'{n}টি ওয়ালেট · {c} এ দেখানো হচ্ছে','{n} wallets · shown in {c}':'{n}টি ওয়ালেট · {c} এ দেখানো হচ্ছে','set exchange rate for {c}':'{c} এর বিনিময় হার দিন','needs exchange rate':'বিনিময় হার দরকার',
'Rent, salary, subscriptions… set them once and they are added for you on time.':'ভাড়া, বেতন, সাবস্ক্রিপশন… একবার ঠিক করুন, সময়মতো নিজে নিজেই যোগ হবে।',
'Every day':'প্রতিদিন','Every week':'প্রতি সপ্তাহে','Every month':'প্রতি মাসে','Every year':'প্রতি বছর','next {d}':'পরবর্তী {d}','ended or paused':'শেষ বা বিরতিতে',
'Saving for something? Set a target and track your progress.':'কিছুর জন্য জমাচ্ছেন? লক্ষ্য ঠিক করুন, অগ্রগতি দেখুন।','by {d}':'{d} এর মধ্যে',
'Money you lent or borrowed. Record it here so nothing is forgotten.':'যে টাকা ধার দিয়েছেন বা নিয়েছেন, এখানে লিখে রাখুন যাতে ভুলে না যান।','Owed to you {x}':'আপনার পাওনা {x}','You owe {x}':'আপনার দেনা {x}',
'Settled':'পরিশোধিত','owes you':'আপনাকে দেবে','you owe':'আপনি দেবেন','due {d}':'নির্ধারিত {d}','overdue since {d}':'{d} থেকে মেয়াদোত্তীর্ণ',
// add / edit sheet
'Expense':'খরচ','Transfer':'ট্রান্সফার','Type or use the keyboard mic: lunch 250 yesterday':'লিখুন বা কিবোর্ডের মাইক ব্যবহার করুন: দুপুরের খাবার ২৫০ গতকাল','Quick add':'দ্রুত যোগ',
'Wallet':'ওয়ালেট','From wallet':'যে ওয়ালেট থেকে','To wallet':'যে ওয়ালেটে','Today':'আজ','Yesterday':'গতকাল','Optional':'ঐচ্ছিক','Receipt photo (optional)':'রসিদের ছবি (ঐচ্ছিক)',
'Take photo':'ছবি তুলুন','Choose':'বেছে নিন','Remove':'সরান','Receipt saved on another device':'রসিদ অন্য ডিভাইসে আছে','Could not save the photo.':'ছবি সংরক্ষণ করা যায়নি।','Could not read that image.':'ছবিটি পড়া যায়নি।',
'This receipt is not on this phone. Receipts are not included in backups.':'এই রসিদ এই ফোনে নেই। ব্যাকআপে রসিদ থাকে না।','Repeat':'পুনরাবৃত্তি','Does not repeat':'পুনরাবৃত্তি নেই','Stop on (optional)':'শেষ তারিখ (ঐচ্ছিক)',
'↻ Part of a repeating series. Changes here only affect this one.':'↻ এটি একটি পুনরাবৃত্ত সিরিজের অংশ। এখানকার পরিবর্তন শুধু এটির ওপর প্রযোজ্য।','Edit the repeat rule':'পুনরাবৃত্তির নিয়ম সম্পাদনা',
'Add':'যোগ করুন','Save changes':'পরিবর্তন সংরক্ষণ','Save':'সংরক্ষণ','Delete':'মুছুন','Cancel':'বাতিল','Discard':'বাদ দিন','Keep editing':'সম্পাদনা চালিয়ে যান','Discard this transaction?':'এই লেনদেন বাদ দেবেন?',
'Discard your changes?':'পরিবর্তনগুলো বাদ দেবেন?','Added':'যোগ হয়েছে','Saved':'সংরক্ষিত','Deleted':'মুছে ফেলা হয়েছে','Undo':'ফিরিয়ে আনুন','Undone':'ফেরানো হয়েছে',
'Added · repeats {f}':'যোগ হয়েছে · {f} পুনরাবৃত্ত হবে','Scheduled · first one on {d}':'নির্ধারিত · প্রথমটি {d} তারিখে','Pick two different wallets.':'দুটি আলাদা ওয়ালেট বাছুন।',
'Add a second wallet first (Wallets tab).':'আগে দ্বিতীয় একটি ওয়ালেট যোগ করুন (টাকা ট্যাব)।','Added {amt} · {cat}':'{amt} যোগ হয়েছে · {cat}','Could not find an amount. Please check the details.':'কোনো পরিমাণ পাওয়া যায়নি। বিবরণ দেখে নিন।',
'{n} budget is 80% used':'{n} বাজেটের ৮০% খরচ হয়েছে','{n} budget used up':'{n} বাজেট শেষ','Monthly':'মাসিক',
// wallets
'New wallet':'নতুন ওয়ালেট','Edit wallet':'ওয়ালেট সম্পাদনা','Name':'নাম','Cash, bKash, Bank…':'নগদ, বিকাশ, ব্যাংক…','Icon':'আইকন','Currency':'মুদ্রা','Balance when you start tracking':'হিসাব শুরুর সময়ের ব্যালেন্স',
'Add wallet':'ওয়ালেট যোগ করুন','Wallet added':'ওয়ালেট যোগ হয়েছে','Wallet saved':'ওয়ালেট সংরক্ষিত','Wallet deleted':'ওয়ালেট মুছে ফেলা হয়েছে','You already have a wallet with that name.':'এই নামে আপনার একটি ওয়ালেট আছে।',
'Delete “{n}”?':'“{n}” মুছবেন?','{n} transactions use this wallet. Move them to:':'{n}টি লেনদেন এই ওয়ালেট ব্যবহার করছে। সেগুলো সরান:','1 transaction uses this wallet. Move it to:':'১টি লেনদেন এই ওয়ালেট ব্যবহার করছে। সেটি সরান:','Move & delete':'সরিয়ে মুছুন',
// repeating
'Repeating expense':'পুনরাবৃত্ত খরচ','Repeating income':'পুনরাবৃত্ত আয়','Active':'সক্রিয়','Delete rule':'নিয়ম মুছুন','Delete this repeat rule?':'এই পুনরাবৃত্তির নিয়ম মুছবেন?','Repeat rule saved':'নিয়ম সংরক্ষিত','Rule deleted':'নিয়ম মুছে ফেলা হয়েছে',
'Changes apply to future entries only. Entries already added stay as they are.':'পরিবর্তন শুধু ভবিষ্যতের এন্ট্রিতে প্রযোজ্য। আগে যোগ হওয়া এন্ট্রি যেমন আছে তেমনই থাকবে।','No more entries will be added. Entries already added stay.':'আর কোনো এন্ট্রি যোগ হবে না। আগের এন্ট্রি থেকে যাবে।',
'The stop date must be after the start date.':'শেষ তারিখ শুরুর তারিখের পরে হতে হবে।',
// settings
'Profile':'প্রোফাইল','Your name':'আপনার নাম','Main currency':'প্রধান মুদ্রা','Changing the currency relabels your amounts. It does not convert them.':'মুদ্রা বদলালে শুধু লেবেল বদলায়, পরিমাণ রূপান্তর হয় না।',
'Overall monthly budget (0 = none)':'মোট মাসিক বাজেট (০ = নেই)','Appearance':'চেহারা','Auto':'অটো','Light':'হালকা','Dark':'গাঢ়','Language':'ভাষা','Categories':'ক্যাটাগরি','+ Add category':'+ ক্যাটাগরি যোগ করুন',
'Monthly budget':'মাসিক বাজেট','Delete category':'ক্যাটাগরি মুছুন','Emoji':'ইমোজি','Colour':'রং','Keep at least one category.':'অন্তত একটি ক্যাটাগরি রাখুন।','Every category needs a name.':'প্রতিটি ক্যাটাগরির নাম দিতে হবে।',
'Transactions in this category will be moved to:':'এই ক্যাটাগরির লেনদেনগুলো সরানো হবে:','Exchange rates':'বিনিময় হার','Used to add up wallets in different currencies.':'ভিন্ন মুদ্রার ওয়ালেট যোগ করতে ব্যবহৃত হয়।','Settings saved':'সেটিংস সংরক্ষিত',
'Reminders':'রিমাইন্ডার','Remind me the day before a bill is due':'বিলের আগের দিন মনে করিয়ে দিন','Daily reminder at 9 pm to log spending':'রাত ৯টায় খরচ লেখার দৈনিক রিমাইন্ডার',
'Notifications are blocked. Turn them on in Android settings to get reminders.':'নোটিফিকেশন বন্ধ আছে। রিমাইন্ডার পেতে অ্যান্ড্রয়েড সেটিংসে চালু করুন।','Bill due tomorrow':'কাল বিল দেওয়ার দিন','Log today’s spending':'আজকের খরচ লিখুন','Add what you spent today in Spendly.':'আজ যা খরচ করেছেন Spendly-তে যোগ করুন।',
'Assistants & shortcuts':'সহকারী ও শর্টকাট','Let assistants add without asking':'জিজ্ঞাসা না করেই সহকারীকে যোগ করতে দিন',
'Share a message like “spent 250 on lunch” to Spendly from any app, or long-press the app icon for quick shortcuts. Links like spendly://add?amount=250&category=Food&note=Lunch open a pre-filled form. They only save straight away if the switch above is on and the link ends with &auto=1.':'যেকোনো অ্যাপ থেকে “দুপুরের খাবারে ২৫০ খরচ” এমন বার্তা Spendly-তে শেয়ার করুন, অথবা অ্যাপ আইকন চেপে ধরে দ্রুত শর্টকাট ব্যবহার করুন। spendly://add?amount=250&category=Food&note=Lunch লিংক একটি পূরণ করা ফর্ম খোলে। উপরের সুইচ চালু থাকলে এবং লিংকের শেষে &auto=1 থাকলেই সরাসরি সংরক্ষণ হয়।',
// security
'Security':'নিরাপত্তা','Ask for a PIN every time you open Spendly. This is a privacy lock, not encryption.':'Spendly খোলার সময় প্রতিবার পিন চাইবে। এটি গোপনীয়তার লক, এনক্রিপশন নয়।','Set up app lock':'অ্যাপ লক চালু করুন','App lock is on.':'অ্যাপ লক চালু আছে।',
'Unlock with fingerprint':'আঙুলের ছাপ দিয়ে খুলুন','Change PIN':'পিন বদলান','Turn off app lock':'অ্যাপ লক বন্ধ করুন','App lock':'অ্যাপ লক','App lock is on':'অ্যাপ লক চালু হয়েছে','App lock is off':'অ্যাপ লক বন্ধ হয়েছে',
'Choose a PIN length. If you forget the PIN you will have to reinstall the app (a Drive or file backup keeps your data).':'পিনের দৈর্ঘ্য বেছে নিন। পিন ভুলে গেলে অ্যাপ নতুন করে ইনস্টল করতে হবে (ড্রাইভ বা ফাইল ব্যাকআপ থাকলে তথ্য থাকবে)।','4-digit PIN':'৪ সংখ্যার পিন','6-digit PIN':'৬ সংখ্যার পিন',
'Create a PIN':'পিন তৈরি করুন','Confirm your PIN':'পিন নিশ্চিত করুন','The PINs did not match. Try again.':'পিন মেলেনি। আবার চেষ্টা করুন।','Use your fingerprint too?':'আঙুলের ছাপও ব্যবহার করবেন?','You can always unlock with your PIN.':'আপনি সবসময় পিন দিয়ে খুলতে পারবেন।','Use fingerprint':'আঙুলের ছাপ ব্যবহার করুন',
'Enter your current PIN':'বর্তমান পিন দিন','Enter your PIN to turn off app lock':'অ্যাপ লক বন্ধ করতে পিন দিন','Wrong PIN':'ভুল পিন','Try again in {s} seconds':'{s} সেকেন্ড পর আবার চেষ্টা করুন','Too many tries. Wait {s} seconds':'অনেকবার চেষ্টা হয়েছে। {s} সেকেন্ড অপেক্ষা করুন','Unlock Spendly':'Spendly খুলুন','Use PIN':'পিন ব্যবহার করুন',
// account & backup
'Google Drive':'গুগল ড্রাইভ','Sign in with Google':'গুগল দিয়ে সাইন ইন','Sign out':'সাইন আউট','Sign out?':'সাইন আউট করবেন?','Signed out':'সাইন আউট হয়েছে','Sync now':'এখনই সিঙ্ক করুন','Synced':'সিঙ্ক হয়েছে','Sync automatically':'নিজে নিজে সিঙ্ক করুন',
'Signing in is optional. Spendly works fully without it and keeps your data on this phone.':'সাইন ইন ঐচ্ছিক। এটি ছাড়াও Spendly পুরোপুরি কাজ করে এবং আপনার তথ্য এই ফোনেই থাকে।',
'Signing in is optional. Your data stays on this phone and keeps working offline. Sign in to back it up to your Google Drive and bring it to another phone.':'সাইন ইন ঐচ্ছিক। আপনার তথ্য এই ফোনে থাকে এবং অফলাইনেও কাজ করে। গুগল ড্রাইভে ব্যাকআপ রাখতে ও অন্য ফোনে আনতে সাইন ইন করুন।',
'Your data is saved in a private folder in your Drive that only Spendly can open. Syncing combines this phone with the backup, so nothing is overwritten.':'আপনার তথ্য ড্রাইভের একটি ব্যক্তিগত ফোল্ডারে থাকে যা শুধু Spendly খুলতে পারে। সিঙ্ক করলে ফোন ও ব্যাকআপ একসাথে মেলানো হয়, কিছু মুছে যায় না।',
'Replace the backup with this phone':'ব্যাকআপ বদলে এই ফোনের তথ্য রাখুন','Replace this phone with the backup':'এই ফোনের তথ্য বদলে ব্যাকআপ রাখুন','Replace the backup?':'ব্যাকআপ বদলাবেন?','Replace backup':'ব্যাকআপ বদলান','Replace this phone?':'এই ফোনের তথ্য বদলাবেন?','Replace phone':'ফোন বদলান',
'The Drive backup will become a copy of this phone.':'ড্রাইভ ব্যাকআপ এই ফোনের কপি হয়ে যাবে।','This phone’s data will be replaced by the Drive backup.':'এই ফোনের তথ্য ড্রাইভ ব্যাকআপ দিয়ে বদলে যাবে।','Backup replaced':'ব্যাকআপ বদলানো হয়েছে','Restored from backup':'ব্যাকআপ থেকে ফেরানো হয়েছে',
'Signed in · backup created':'সাইন ইন হয়েছে · ব্যাকআপ তৈরি হয়েছে','Signed in · data combined':'সাইন ইন হয়েছে · তথ্য একত্র করা হয়েছে','Signed in · your backup was restored':'সাইন ইন হয়েছে · ব্যাকআপ ফিরিয়ে আনা হয়েছে',
'You already have a backup':'আপনার ইতিমধ্যে একটি ব্যাকআপ আছে','This phone has data and so does your Google Drive backup. What should Spendly do?':'এই ফোনে তথ্য আছে এবং গুগল ড্রাইভ ব্যাকআপেও আছে। Spendly কী করবে?','Combine both (recommended)':'দুটোই একত্র করুন (প্রস্তাবিত)','Use the Drive backup':'ড্রাইভ ব্যাকআপ ব্যবহার করুন','Keep this phone’s data':'এই ফোনের তথ্য রাখুন',
'Your data stays on this phone. It just stops syncing.':'আপনার তথ্য এই ফোনেই থাকবে। শুধু সিঙ্ক বন্ধ হবে।','Backup file':'ব্যাকআপ ফাইল','Export backup file':'ব্যাকআপ ফাইল এক্সপোর্ট','Import a file (backup or CSV)':'ফাইল ইমপোর্ট (ব্যাকআপ বা CSV)','Export spreadsheet (CSV)':'স্প্রেডশিট এক্সপোর্ট (CSV)',
'A copy you can keep anywhere. Import it later on any phone. Receipt photos stay on this phone and are not included in backups.':'একটি কপি যা যেকোনো জায়গায় রাখতে পারেন। পরে যেকোনো ফোনে ইমপোর্ট করুন। রসিদের ছবি এই ফোনেই থাকে, ব্যাকআপে যায় না।',
'Data':'তথ্য','Load sample data':'নমুনা তথ্য যোগ করুন','Remove sample data':'নমুনা তথ্য সরান','Sample data added':'নমুনা তথ্য যোগ হয়েছে','Sample data removed':'নমুনা তথ্য সরানো হয়েছে','Delete all data':'সব তথ্য মুছুন','Delete all data?':'সব তথ্য মুছবেন?',
'Transactions, wallets, categories and settings on this phone will be erased.':'এই ফোনের লেনদেন, ওয়ালেট, ক্যাটাগরি ও সেটিংস মুছে যাবে।','Delete everything':'সব মুছুন','Everything was deleted':'সব মুছে ফেলা হয়েছে',
'Import this backup?':'এই ব্যাকআপ ইমপোর্ট করবেন?','Add to my data':'আমার তথ্যের সাথে যোগ করুন','Replace my data':'আমার তথ্য বদলে দিন','Imported':'ইমপোর্ট হয়েছে','Could not read that file.':'ফাইলটি পড়া যায়নি।','Recovered your data from the app’s backup copy':'অ্যাপের ব্যাকআপ কপি থেকে আপনার তথ্য ফিরিয়ে আনা হয়েছে',
'Could not save on this device. Export a backup now.':'এই ডিভাইসে সংরক্ষণ করা যায়নি। এখনই ব্যাকআপ এক্সপোর্ট করুন।','Google Drive refused access.':'গুগল ড্রাইভ অনুমতি দেয়নি।','Google sign-in works in the Android app.':'গুগল সাইন ইন অ্যান্ড্রয়েড অ্যাপে কাজ করে।',
// goals & loans
'New goal':'নতুন লক্ষ্য','Edit goal':'লক্ষ্য সম্পাদনা','What are you saving for?':'কিসের জন্য জমাচ্ছেন?','Laptop, Hajj, Emergency fund…':'ল্যাপটপ, হজ, জরুরি তহবিল…','Target date (optional)':'লক্ষ্য তারিখ (ঐচ্ছিক)','Already saved (optional)':'ইতিমধ্যে জমানো (ঐচ্ছিক)',
'Add or take out money':'টাকা যোগ করুন বা তুলুন','Take out':'তুলুন','Create goal':'লক্ষ্য তৈরি করুন','Goal created':'লক্ষ্য তৈরি হয়েছে','Goal saved':'লক্ষ্য সংরক্ষিত','Goal deleted':'লক্ষ্য মুছে ফেলা হয়েছে','Delete this goal?':'এই লক্ষ্য মুছবেন?',
'Saved {a} of {b}':'{b} এর মধ্যে {a} জমেছে','about {x} a month to get there':'পৌঁছাতে মাসে প্রায় {x}','You only have {x} saved.':'আপনার মাত্র {x} জমা আছে।',
'New loan':'নতুন ধার','Edit loan':'ধার সম্পাদনা','I lent money':'আমি ধার দিয়েছি','I borrowed':'আমি ধার নিয়েছি','Person':'ব্যক্তি','Due (optional)':'নির্ধারিত তারিখ (ঐচ্ছিক)','Record a payment':'পরিশোধ লিখুন','Add payment':'পরিশোধ যোগ করুন','Mark as settled':'পরিশোধিত হিসেবে চিহ্নিত করুন',
'Add loan':'ধার যোগ করুন','Loan added':'ধার যোগ হয়েছে','Loan saved':'ধার সংরক্ষিত','Loan deleted':'ধার মুছে ফেলা হয়েছে','Delete this loan?':'এই ধার মুছবেন?','Paid back {a} · {b} left':'{a} ফেরত · {b} বাকি','That is more than the amount left ({x}).':'এটি বাকি পরিমাণের ({x}) চেয়ে বেশি।',
// ask AI
'Spendly puts a short summary of your numbers below (no notes, no wallet names). Send it to Gemini or any assistant to get advice. Nothing leaves your phone until you tap Share.':'Spendly নিচে আপনার হিসাবের একটি সংক্ষিপ্ত সারাংশ দিচ্ছে (নোট বা ওয়ালেটের নাম ছাড়া)। পরামর্শের জন্য এটি Gemini বা যেকোনো সহকারীকে পাঠান। শেয়ার চাপার আগে কিছুই ফোন থেকে বের হয় না।',
'How much should I save this month?':'এই মাসে কত সঞ্চয় করা উচিত?','How much can I spend per day?':'দিনে কত খরচ করতে পারি?','Where can I cut spending?':'কোথায় খরচ কমাতে পারি?','Copy':'কপি','Share…':'শেয়ার…','Copied. Paste it into your assistant.':'কপি হয়েছে। আপনার সহকারীতে পেস্ট করুন।','Could not copy.':'কপি করা যায়নি।','Could not share.':'শেয়ার করা যায়নি।',
// misc
'OK':'ঠিক আছে','Expense ':'খরচ','Transfer ':'ট্রান্সফার','English':'English','Type':'ধরন','Receipt ':'রসিদ','Preparing':'তৈরি হচ্ছে'
};
