const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// 创建 MySQL 连接池
const pool = mysql.createPool({
  // host: 'localhost',
  // user: 'root',
  host: '47.117.173.54',
  user: 'workshop',
  password: '123456',
  database: 'workshop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 获取连接
function getConnection() {
  return pool.promise().getConnection();
}

// 用户鉴权接口
app.post('/auth', (req, res) => {
  const { code } = req.body;
  // 调用微信 API 获取 openid
  axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=wxcf6c566a364eee9b&secret=b80403edf35083714a338d249fee125c&js_code=${code}&grant_type=authorization_code`)
    .then(async response => {
      const openid = response.data.openid;
      console.log('openid', openid);
      let connection;
      // 从连接池获取连接
      getConnection()
      .then(conn => {
        connection = conn;
        // 使用 then 执行查询
        return connection.query('SELECT * FROM employees WHERE openid = ?', [openid]);
      })
      .then(([results]) => {
        if (results.length === 0) {
          res.json({ message: '用户未注册，请联系管理员' });
        } else {
          console.log('results', results);
          res.json(results[0]);
        }
      })
      .catch(error => {
        console.error('error', error);
        res.status(500).json({ message: '获取 用户信息 失败' });
      })
      .finally(() => {
        if (connection) connection.release(); // 释放连接
      });
    })
    .catch(error => {
      res.status(500).json({ message: '获取 openid 失败' });
    });
});

// 获取参数接口
app.get('/params', (req, res) => {
  let connection;
  // 从连接池获取连接
  getConnection()
  .then(conn => {
    connection = conn;
    // 使用 then 执行查询
    return connection.query('SELECT * FROM params');
  })
  .then(([results]) => {
    if (results.length === 0) {
      res.json({ message: '没有参数' });
    } else {
      console.log('results', results);
      res.json(results[0]);
    }
  })
  .catch(error => {
    console.error('error', error);
    res.status(500).json({ message: '获取 参数 失败' });
  })
  .finally(() => {
    if (connection) connection.release(); // 释放连接
  });
});

// 开工记录接口
app.post('/start', async (req, res) => {
  const { productCode, taskNumber, batchNumber, drawingNumber, productName, process, startTime, openid } = req.body;
  const sql = 'INSERT INTO startRecords SET ?';
  const record = { productCode, taskNumber, batchNumber, drawingNumber, productName, process, startTime, openid };
  const connection = await getConnection(); // 获取连接
  connection.query(sql, record, (err, result) => {
    if (err) throw err;
    res.json({ message: '开工记录提交成功' });
  });
});

// 报工记录接口
app.post('/report', async (req, res) => {
  const { productCode, taskNumber, batchNumber, drawingNumber, productName, process, quantity, openid } = req.body;
  const sql = 'INSERT INTO reportRecords SET ?';
  const record = { productCode, taskNumber, batchNumber, drawingNumber, productName, process, quantity, openid };
  const connection = await getConnection(); // 获取连接
  connection.query(sql, record, (err, result) => {
    if (err) throw err;
    res.json({ message: '报工记录提交成功' });
  });
});

// 完工记录接口
app.post('/end', async (req, res) => {
  const { productCode, taskNumber, batchNumber, drawingNumber, productName, process, endTime, openid } = req.body;
  const sql = 'INSERT INTO endRecords SET ?';
  const record = { productCode, taskNumber, batchNumber, drawingNumber, productName, process, endTime, openid };
  const connection = await getConnection(); // 获取连接
  connection.query(sql, record, (err, result) => {
    if (err) throw err;
    res.json({ message: '完工记录提交成功' });
  });
});

// 启动服务
const PORT = 2909;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});