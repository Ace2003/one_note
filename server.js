const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const nlpAnalyzer = require('./nlp-analyzer');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let records = [];
let nextId = 1;

app.get('/api/records', (req, res) => {
  res.json({ success: true, data: records });
});

app.post('/api/analyze', (req, res) => {
  const { text } = req.body;
  
  if (!text || text.trim() === '') {
    return res.status(400).json({ success: false, message: '请输入内容' });
  }

  const result = nlpAnalyzer.analyze(text);
  res.json({ success: true, data: result });
});

app.post('/api/records', (req, res) => {
  const { text, time, location, item, amount, category, type } = req.body;
  
  const record = {
    id: nextId++,
    text: text || '',
    time: time || new Date().toISOString(),
    location: location || '',
    item: item || '',
    amount: amount || null,
    category: category || '其他',
    type: type || '支出',
    createdAt: new Date().toISOString()
  };
  
  records.unshift(record);
  res.json({ success: true, data: record });
});

app.put('/api/records/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = records.findIndex(r => r.id === id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }
  
  records[index] = { ...records[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ success: true, data: records[index] });
});

app.delete('/api/records/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = records.findIndex(r => r.id === id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }
  
  records.splice(index, 1);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
