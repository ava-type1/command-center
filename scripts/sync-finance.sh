#!/bin/bash
# sync-finance.sh - Pull financial data from SimpleFIN and generate finance.json
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/../data"
OUTPUT="$DATA_DIR/finance.json"
TMPFILE=$(mktemp)

# Read access URL
ACCESS_URL_FILE="/root/.clawdbot/secrets/simplefin-access-url"
if [ ! -f "$ACCESS_URL_FILE" ]; then
  echo "ERROR: SimpleFIN access URL file not found at $ACCESS_URL_FILE"
  exit 1
fi

ACCESS_URL=$(cat "$ACCESS_URL_FILE" | tr -d '[:space:]')

# Calculate date range: last 30 days
END_EPOCH=$(date +%s)
START_EPOCH=$((END_EPOCH - 30*86400))

echo "Fetching SimpleFIN data from $(date -d @$START_EPOCH +%Y-%m-%d) to $(date -d @$END_EPOCH +%Y-%m-%d)..."

# Fetch accounts data from SimpleFIN and save to temp file
curl -s --fail "${ACCESS_URL}/accounts?start-date=${START_EPOCH}&end-date=${END_EPOCH}" > "$TMPFILE"

if [ ! -s "$TMPFILE" ]; then
  echo "ERROR: Empty response from SimpleFIN"
  rm -f "$TMPFILE"
  exit 1
fi

echo "Raw data received, processing..."

# Process with Python, reading from temp file
python3 - "$TMPFILE" "$OUTPUT" "$START_EPOCH" "$END_EPOCH" << 'PYEOF'
import json
import sys
from datetime import datetime, timezone
from collections import defaultdict

input_path = sys.argv[1]
output_path = sys.argv[2]
start_epoch = int(sys.argv[3])
end_epoch = int(sys.argv[4])

with open(input_path) as f:
    data = json.load(f)

accounts = data.get("accounts", [])

if not accounts:
    print("WARNING: No accounts found")
    sys.exit(1)

# Use first account (primary checking)
account = accounts[0]
account_name = account.get("name", "Unknown")
balance_raw = account.get("balance", "0")
available_raw = account.get("available-balance", balance_raw)

balance = float(balance_raw) if balance_raw else 0.0
available = float(available_raw) if available_raw else balance

transactions = account.get("transactions", [])
print(f"Found {len(transactions)} transactions in {account_name}")

# Categorization rules
def categorize(desc, amount):
    desc_lower = desc.lower()
    
    # Gas/Fuel
    gas_keywords = ['shell', 'exxon', 'chevron', 'bp ', 'mobil', 'marathon', 'speedway', 
                    'circle k', 'wawa', 'sheetz', 'pilot', 'loves', 'murphy', 'racetrac',
                    'gas', 'fuel', 'valero', 'sunoco', 'citgo', 'casey', 'quiktrip', 'qt ',
                    'kwik trip', 'bucees', 'buc-ee', 'sinclair', 'conoco', 'phillips 66',
                    'kum & go', 'mapco', 'kangaroo', 'flying j', 'petro', 'ampm',
                    'pit stop', 'sunstop', 'raceway', 'discount food mart']
    for kw in gas_keywords:
        if kw in desc_lower:
            return 'Gas/Fuel'
    
    # Groceries
    grocery_keywords = ['walmart', 'wal-mart', 'kroger', 'aldi', 'publix', 'heb ', 'h-e-b',
                       'safeway', 'albertson', 'trader joe', 'whole foods', 'costco',
                       'sam\'s club', 'sams club', 'grocery', 'market', 'food lion',
                       'piggly', 'winn-dixie', 'winn dixie', 'meijer', 'iga ', 'lidl',
                       'save-a-lot', 'winco', 'wegmans', 'sprouts', 'fresh market',
                       'family dollar', 'dollar general', 'dollar tree']
    for kw in grocery_keywords:
        if kw in desc_lower:
            return 'Groceries'
    
    # Food/Dining
    food_keywords = ['mcdonald', 'burger king', 'wendy', 'taco bell', 'chick-fil',
                    'subway', 'domino', 'pizza', 'starbucks', 'dunkin', 'chipotle',
                    'panera', 'sonic', 'arby', 'popeye', 'kfc', 'panda express',
                    'waffle', 'ihop', 'denny', 'applebee', 'chili', 'olive garden',
                    'restaurant', 'cafe', 'diner', 'grill', 'doordash', 'grubhub',
                    'uber eat', 'ubereats', 'postmates', 'zaxby',
                    'raising cane', 'whataburger', 'jack in the box', 'five guys',
                    'cookout', 'bojangle', 'cracker barrel', 'golden corral',
                    'hungry howie', 'canteen vending']
    for kw in food_keywords:
        if kw in desc_lower:
            return 'Food/Dining'
    
    # Subscriptions/Recurring
    sub_keywords = ['netflix', 'hulu', 'disney', 'spotify', 'apple.com', 'apple com',
                   'youtube', 'claude', 'anthropic', 'openai', 'chatgpt', 'github',
                   'microsoft', 'adobe', 'dropbox', 'google storage', 'icloud',
                   'google workspace', 'cursor', 'windstream',
                   'playstation', 'xbox', 'nintendo', 'crunchyroll', 'paramount',
                   'peacock', 'hbo', 'max.com', 'audible', 'kindle',
                   'subscription', 'premium', 'patreon',
                   'cloudflare', 'vercel', 'heroku', 'digitalocean', 'contabo',
                   'namecheap', 'godaddy', 'hover', 'twilio', 'notion', 'linear',
                   'figma', 'canva', 'grammarly', 'nordvpn', 'expressvpn',
                   'geico', 'simply business', 'simplybusines',
                   'clay electric', 'insurance',
                   'att', 'at&t', 'verizon', 't-mobile', 'tmobile']
    for kw in sub_keywords:
        if kw in desc_lower:
            return 'Subscriptions/Recurring'
    
    # ATM/Cash
    atm_keywords = ['atm', 'cash withdrawal', 'cash back', 'withdraw']
    for kw in atm_keywords:
        if kw in desc_lower:
            return 'ATM/Cash'
    
    # Bank Fees
    fee_keywords = ['fee', 'overdraft', 'nsf', 'service charge', 'maintenance fee',
                   'maintenance', 'interest charge', 'intl txn']
    for kw in fee_keywords:
        if kw in desc_lower:
            return 'Bank Fees'
    
    # Shopping
    shop_keywords = ['amazon', 'ebay', 'etsy', 'best buy', 'home depot', 'lowes',
                    'autozone', 'advance auto', 'o\'reilly', 'napa ',
                    'ross', 'tjmaxx', 'marshalls', 'burlington', 'goodwill', 'thrift',
                    'gamestop', 'bath & body', 'old navy', 'gap ', 'kohls',
                    'jcpenney', 'hobby lobby', 'michaels', 'joann', 'temu',
                    'shein', 'wish.com', 'ace hardware', 'target',
                    'north florida pharmacy', 'pharmacy',
                    'hometowne capital', 'smokey']
    for kw in shop_keywords:
        if kw in desc_lower:
            return 'Shopping'
    
    # Transfer/Income
    income_keywords = ['direct dep', 'payroll', 'salary', 'deposit', 'transfer from',
                      'refund', 'return', 'grace fee refund']
    for kw in income_keywords:
        if kw in desc_lower:
            return 'Income/Transfer'
    
    return 'Other'

# Process transactions
categories = defaultdict(lambda: {"total": 0.0, "count": 0})
stores = defaultdict(lambda: {"total": 0.0, "count": 0})
payee_history = defaultdict(list)
recent = []

for txn in transactions:
    amount_raw = txn.get("amount", "0")
    amount = float(amount_raw) if amount_raw else 0.0
    desc = txn.get("description", txn.get("payee", "Unknown"))
    payee = txn.get("payee", desc)
    posted = txn.get("posted", txn.get("transacted_at", 0))
    
    payee_clean = payee.strip() if payee else desc.strip()
    
    try:
        txn_date = datetime.fromtimestamp(int(posted), tz=timezone.utc).strftime("%Y-%m-%d")
    except (ValueError, OSError):
        txn_date = "Unknown"
    
    category = categorize(desc, amount)
    
    is_spending = amount < 0
    spend_amount = abs(amount)
    
    if is_spending and category != 'Income/Transfer':
        categories[category]["total"] += spend_amount
        categories[category]["count"] += 1
        
        store_name = payee_clean[:40]
        stores[store_name]["total"] += spend_amount
        stores[store_name]["count"] += 1
    
    payee_history[payee_clean].append({
        "amount": amount,
        "date": txn_date,
    })
    
    recent.append({
        "date": txn_date,
        "description": desc[:60],
        "payee": payee_clean[:40],
        "amount": round(amount, 2),
        "category": category,
    })

# Sort recent by date (newest first)
recent.sort(key=lambda x: x["date"], reverse=True)
recent = recent[:30]

# Build categories list
cat_list = []
for name, data in sorted(categories.items(), key=lambda x: -x[1]["total"]):
    if name == 'Income/Transfer':
        continue
    cat_list.append({
        "name": name,
        "total": round(data["total"], 2),
        "count": data["count"],
    })

# Build top stores
store_list = []
for name, data in sorted(stores.items(), key=lambda x: -x[1]["total"]):
    store_list.append({
        "name": name,
        "total": round(data["total"], 2),
        "count": data["count"],
    })
store_list = store_list[:15]

# Detect recurring charges
recurring = []
for payee_name, entries in payee_history.items():
    spending = [e for e in entries if e["amount"] < 0]
    if len(spending) >= 2:
        amounts = [abs(e["amount"]) for e in spending]
        avg_amount = sum(amounts) / len(amounts)
        if avg_amount > 1.0 and all(abs(a - avg_amount) / max(avg_amount, 0.01) < 0.25 for a in amounts):
            latest_date = max(e["date"] for e in spending)
            recurring.append({
                "name": payee_name[:40],
                "amount": round(avg_amount, 2),
                "count": len(spending),
                "lastDate": latest_date,
            })

recurring.sort(key=lambda x: -x["amount"])
recurring = recurring[:20]

# Monthly minimum
total_spending = sum(cat["total"] for cat in cat_list)
days_in_period = (end_epoch - start_epoch) / 86400
monthly_minimum = round((total_spending / max(days_in_period, 1)) * 30, 2)

output = {
    "lastUpdated": datetime.now(timezone.utc).isoformat(),
    "account": {
        "name": account_name,
        "balance": round(balance, 2),
        "available": round(available, 2),
    },
    "categories": cat_list,
    "topStores": store_list,
    "recurring": recurring,
    "monthlyMinimum": monthly_minimum,
    "totalSpending": round(total_spending, 2),
    "recentTransactions": recent,
    "period": {
        "start": datetime.fromtimestamp(start_epoch, tz=timezone.utc).strftime("%Y-%m-%d"),
        "end": datetime.fromtimestamp(end_epoch, tz=timezone.utc).strftime("%Y-%m-%d"),
    },
}

with open(output_path, "w") as f:
    json.dump(output, f, indent=2)

print(f"Finance data written to {output_path}")
print(f"  Account: {account_name}")
print(f"  Balance: ${balance:.2f} (Available: ${available:.2f})")
print(f"  Transactions: {len(transactions)}")
print(f"  Categories: {len(cat_list)}")
print(f"  Top stores: {len(store_list)}")
print(f"  Recurring: {len(recurring)}")
print(f"  Monthly minimum: ${monthly_minimum:.2f}")
PYEOF

rm -f "$TMPFILE"
echo "Done! Finance data synced."
