# 🔗 Blockchain Explorer - User Guide

## Overview

The **Blockchain Explorer** is an interactive web interface that allows you to view and explore the TaxGuard blockchain in real-time. It provides a comprehensive view of all blocks, transactions, and events recorded on the immutable ledger.

---

## 🌐 Accessing the Blockchain Explorer

### Via Frontend Dashboard:
1. Open the frontend dashboard: http://localhost:5173
2. Click the **"Blockchain"** tab in the navigation bar
3. The explorer will load automatically with live data

### Features Available:
- ✅ Real-time blockchain statistics
- ✅ Complete block history
- ✅ Individual block details
- ✅ Transaction/event listings
- ✅ Chain visualization
- ✅ Hash verification
- ✅ Auto-refresh every 10 seconds

---

## 📊 Explorer Tabs

### 1. **Overview Tab**
The overview provides a high-level summary of the blockchain.

**Stats Displayed:**
- **Total Blocks** - Number of blocks in the chain (including genesis)
- **Total Events** - Number of tax events recorded
- **Latest Block** - Most recent block with hash preview
- **Chain Status** - Validation status (Valid/Invalid)

**Latest Block Details:**
- Block index number
- Timestamp
- Number of transactions
- Nonce value
- Full block hash
- Previous block hash

**Visual Chain:**
- Last 5 blocks displayed as cards
- Shows block connections
- Click any block to view full details
- Real-time updates

---

### 2. **Blocks Tab**
View all blocks in the blockchain ledger.

**Block Information:**
- Block index (#0, #1, #2, etc.)
- Timestamp (when block was created)
- Number of events/transactions
- Block hash (truncated for display)
- Previous block hash

**Actions:**
- Click any block to view full details
- See all transactions within a block
- View hash verification
- Scroll through entire chain history

---

### 3. **Events Tab**
View all tax events recorded on the blockchain.

**Event Details:**
- Event ID (unique identifier)
- Event type (filing, payment, audit, compliance, etc.)
- Anonymized user ID
- Timestamp
- Block number where event is stored
- Payload hash (SHA-256)
- Optional notes

**Event Types:**
- 🔵 **Filing** - Tax return submissions
- 🟢 **Payment** - Tax payments
- 🔴 **Audit Flag** - Risk alerts
- 🟡 **Compliance** - Compliance checks
- 🟣 **Admin Change** - System changes
- 🟠 **Whistleblower** - Anonymous reports

---

## 🔍 Block Details Modal

Click any block to open a detailed view:

**Information Shown:**
- Complete block header
- Full block hash (not truncated)
- Previous block hash
- Timestamp
- Nonce value
- All transactions/events in JSON format
- Block index number

**Actions:**
- Copy hashes for verification
- View transaction details
- Close modal to return to list

---

## 🎨 Visual Elements

### Color Coding:
- **Blue blocks** - Regular blocks with transactions
- **Green badge** - Valid chain status
- **Red badge** - Invalid chain (integrity issue)
- **Event colors** - Different colors for each event type

### Icons:
- 🛡️ Shield - Blockchain security
- 📦 Box - Individual blocks
- # Hash - Block hashes
- ⏰ Clock - Timestamps
- 💾 Database - Blockchain storage
- ✅ Check - Validation
- 📈 Activity - Events/transactions

---

## 🔄 Real-Time Updates

The explorer automatically refreshes data every **10 seconds**:
- New blocks appear automatically
- Statistics update in real-time
- Latest events show at the top
- Chain validation status refreshes
- No manual refresh needed

---

## 🛠️ Understanding the Data

### Block Structure:
```json
{
  "index": 5,
  "timestamp": "2025-10-02T19:09:10.274Z",
  "data": {
    "eventId": "evt-filing-001",
    "eventType": "filing",
    "anonymizedUserId": "taxpayer-abc123",
    "hashOfPayload": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "notes": "VAT Return Filed - Q3 2025"
  },
  "previousHash": "2247aac4463c2daa4fd3967e...",
  "hash": "93e1e10b6cc10e57c71809c70a1d5a12...",
  "nonce": 12345
}
```

### Hash Verification:
- Each block contains a hash of the previous block
- Creates an immutable chain
- Any tampering breaks the hash chain
- Explorer shows validation status

---

## 📱 Responsive Design

The explorer works on all screen sizes:
- **Desktop** - Full grid layout with multiple columns
- **Tablet** - Adjusted grid, scrollable sections
- **Mobile** - Single column, stacked cards

---

## 🎯 Use Cases

### For Auditors:
- View complete audit trail
- Verify transaction authenticity
- Check block integrity
- Trace event history
- Export data for reports

### For Taxpayers:
- Confirm event submissions
- View submission timestamps
- Verify event inclusion in blockchain
- Check transaction status

### For Administrators:
- Monitor blockchain health
- Verify chain integrity
- Check system activity
- Review all events
- Identify patterns

---

## 🔐 Security Features

### Immutability:
- All data is read-only
- Cannot modify past blocks
- Hash chain prevents tampering
- Cryptographic verification

### Transparency:
- All events visible to authorized users
- Complete audit trail
- Timestamp verification
- Hash-based integrity

---

## 💡 Tips & Tricks

1. **Quick Block Navigation:**
   - Use the visual chain in Overview tab
   - Click blocks for instant details
   - Last 5 blocks always visible

2. **Finding Specific Events:**
   - Go to Events tab
   - Use event ID to locate specific entries
   - Check block number reference

3. **Verifying Integrity:**
   - Check "Chain Valid" badge in header
   - Green = Valid, Red = Integrity issue
   - Auto-validates every 10 seconds

4. **Understanding Hashes:**
   - Each hash is unique
   - Truncated in lists (8 chars each end)
   - Full hash in detail view
   - SHA-256 format (64 characters)

5. **Performance:**
   - Explorer loads quickly (<2 seconds)
   - Auto-refresh is lightweight
   - Handles 100+ blocks efficiently
   - Smooth scrolling

---

## ⚡ Keyboard Shortcuts

- **ESC** - Close block detail modal
- **Click outside** - Close modal
- **Tab navigation** - Switch between tabs

---

## 🐛 Troubleshooting

### Explorer Not Loading:
1. Check blockchain API is running: http://localhost:3001
2. Verify frontend server: http://localhost:5173
3. Check console for errors (F12)
4. Refresh page

### No Blocks Showing:
1. Ensure blockchain API is started
2. Check API URL in .env file
3. Verify network connectivity
4. Check browser console for errors

### Data Not Updating:
1. Auto-refresh runs every 10 seconds
2. Manually refresh page if needed
3. Check API health: http://localhost:3001/api/health
4. Verify no network errors

---

## 🚀 Advanced Features

### Chain Visualization:
- Visual representation of block links
- Shows last 5 blocks horizontally
- Connected by lines
- Click to expand details

### Transaction Details:
- JSON formatted data
- Copy-paste friendly
- Syntax highlighting
- Expandable views

### Real-Time Statistics:
- Live block count
- Event totals
- Latest block info
- Chain validation status

---

## 📖 API Integration

The explorer uses these endpoints:

```bash
GET /api/blockchain        # Get entire blockchain
GET /api/events           # Get all events
GET /api/blockchain/validate  # Validate chain (future)
GET /api/blockchain/stats     # Statistics (future)
```

---

## 🎓 Learning Resources

### Understanding Blockchain:
- Each block contains data + previous hash
- Genesis block (index 0) starts the chain
- Hashes link blocks together
- Immutable once written

### Tax Event Flow:
1. Event submitted via API
2. Added to new block
3. Block mined (hash calculated)
4. Added to blockchain
5. Visible in explorer immediately

---

## 📞 Support

### Need Help?
- Check documentation: `QUICK_START_GUIDE.md`
- API docs: http://localhost:4000/api-docs
- GitHub issues: [Repository URL]

### Common Questions:
- **Q: Can I delete a block?**
  - A: No, blockchain is immutable

- **Q: How do I add events?**
  - A: Use the API Gateway: POST /api/events

- **Q: What's a hash?**
  - A: Unique fingerprint of block data

- **Q: Why is chain valid/invalid?**
  - A: Validates hash chain integrity

---

## 🏆 Best Practices

1. **Regular Monitoring:**
   - Check explorer daily
   - Verify chain integrity
   - Review new events

2. **Event Verification:**
   - Always check event inclusion
   - Verify timestamps
   - Confirm hash values

3. **Performance:**
   - Don't keep multiple tabs open
   - Close detail modals after viewing
   - Let auto-refresh work

4. **Security:**
   - Only use over HTTPS in production
   - Don't share sensitive hashes publicly
   - Verify SSL certificates

---

## 🎉 Features Coming Soon

- [ ] Search functionality
- [ ] Advanced filters
- [ ] Export to PDF/CSV
- [ ] Custom date ranges
- [ ] Block comparison
- [ ] Transaction graphs
- [ ] Analytics dashboard
- [ ] Mobile app

---

**Built for ZRA Hackathon 2025** 🏆

**Version:** 1.0.0
**Last Updated:** October 2, 2025
**Status:** ✅ Production Ready

---

*"Explore the future of tax compliance with blockchain transparency"*
