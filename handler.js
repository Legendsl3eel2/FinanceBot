const { addTransaction, getMonthlyTransactions } = require('./database');

// เก็บ state ของแต่ละ user ว่ากำลังทำอะไรอยู่
const userState = {};

async function handler(event, client) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userId = event.source.userId;
  const text = event.message.text.trim();

  // เมนูหลัก
  if (text === 'เมนู' || text === 'menu') {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{
        type: 'text',
        text: '💰 FinanceBot\n\nพิมพ์คำสั่งได้เลย\n\n1️⃣ รายรับ - บันทึกเงินเข้า\n2️⃣ รายจ่าย - บันทึกเงินออก\n3️⃣ สรุป - ดูยอดเดือนนี้'
      }]
    });
  }

  // บันทึกรายรับ
  if (text === '1' || text === 'รายรับ') {
    userState[userId] = { step: 'income_amount' };
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: '💵 ใส่จำนวนเงินที่ได้รับ (บาท)' }]
    });
  }

  // บันทึกรายจ่าย
  if (text === '2' || text === 'รายจ่าย') {
    userState[userId] = { step: 'expense_amount' };
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: '💸 ใส่จำนวนเงินที่จ่ายไป (บาท)' }]
    });
  }

  // สรุปรายรับรายจ่าย
  if (text === '3' || text === 'สรุป') {
    const rows = getMonthlyTransactions(userId);
    const income = rows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const expense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const balance = income - expense;

    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{
        type: 'text',
        text: `📊 สรุปเดือนนี้\n\n💵 รายรับ: ${income.toLocaleString()} บาท\n💸 รายจ่าย: ${expense.toLocaleString()} บาท\n💰 คงเหลือ: ${balance.toLocaleString()} บาท`
      }]
    });
  }

  // รับค่าจาก state
  if (userState[userId]) {
    const state = userState[userId];

    if (state.step === 'income_amount' || state.step === 'expense_amount') {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        return client.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: '❌ กรุณาใส่ตัวเลขที่ถูกต้องครับ' }]
        });
      }
      userState[userId].amount = amount;
      userState[userId].step = state.step === 'income_amount' ? 'income_desc' : 'expense_desc';

      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: '📝 ใส่รายละเอียด เช่น ค่าอาหาร, เงินเดือน' }]
      });
    }

    if (state.step === 'income_desc' || state.step === 'expense_desc') {
      const type = state.step === 'income_desc' ? 'income' : 'expense';
      addTransaction(userId, type, state.amount, text);
      delete userState[userId];

      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{
          type: 'text',
          text: `✅ บันทึกแล้วครับ\n${type === 'income' ? '💵 รายรับ' : '💸 รายจ่าย'}: ${state.amount.toLocaleString()} บาท\n📝 ${text}`
        }]
      });
    }
  }

  // ถ้าไม่รู้จักคำสั่ง
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [{ type: 'text', text: 'พิมพ์ "เมนู" เพื่อดูคำสั่งทั้งหมดครับ 😊' }]
  });
}

module.exports = handler;