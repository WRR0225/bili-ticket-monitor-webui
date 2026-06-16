import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());

// 缓存上一次的数据
let lastData = null;

// 代理B站API
app.get('/api/ticket/:id', async (req, res) => {
  const ticketId = req.params.id;
  const url = `https://show.bilibili.com/api/ticket/project/getV2?version=134&id=${ticketId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://show.bilibili.com/',
      },
    });

    if (response.status === 412) {
      return res.status(412).json({ error: '触发风控，请稍后再试' });
    }

    const data = await response.json();
    
    if (data.code === 0 && data.data) {
      const result = parseTicketData(data.data);
      lastData = result;
      res.json(result);
    } else {
      res.status(400).json({ error: data.message || '获取数据失败' });
    }
  } catch (err) {
    console.error('请求失败:', err.message);
    // 如果有缓存数据，返回缓存
    if (lastData) {
      res.json({ ...lastData, cached: true });
    } else {
      res.status(500).json({ error: '请求失败，请稍后重试' });
    }
  }
});

// 解析票务数据
function parseTicketData(data) {
  const name = data.name || '';
  const saleFlagMap = {
    1: '未开售',
    2: '预售中',
    3: '暂时售罄',
    4: '已售罄',
    5: '已停售',
    6: '不可售',
  };

  const screens = data.screen_list || [];
  const screenData = screens.map(screen => {
    const screenName = screen.screen_name || screen.screenName || screen.name || '';
    const tickets = (screen.ticket_list || []).map(ticket => {
      const saleFlag = ticket.sale_flag || {};
      const statusText = saleFlagMap[saleFlag.sale_flag_num] || saleFlag.display_name || '未知';
      
      return {
        id: ticket.id,
        name: `${screenName} ${ticket.desc || ''}`.trim(),
        screenName: screenName,
        desc: ticket.desc || '',
        status: statusText,
        statusNum: saleFlag.sale_flag_num || 0,
        price: ticket.price || '',
        saleFlag: saleFlag,
      };
    });

    return {
      screenName: screenName,
      tickets,
    };
  });

  // 统计各状态数量
  const allTickets = screenData.flatMap(s => s.tickets);
  const stats = {
    total: allTickets.length,
    soldOut: allTickets.filter(t => t.status === '已售罄').length,
    tempSoldOut: allTickets.filter(t => t.status === '暂时售罄').length,
    onSale: allTickets.filter(t => t.status === '预售中').length,
    notStarted: allTickets.filter(t => t.status === '未开售').length,
    stopped: allTickets.filter(t => t.status === '已停售').length,
    unavailable: allTickets.filter(t => t.status === '不可售').length,
  };

  return {
    name,
    screens: screenData,
    allTickets,
    stats,
    timestamp: new Date().toISOString(),
  };
}

// ========== 模拟接口 ==========
const mockTicketStates = {};
const MOCK_STATUSES = ['预售中', '暂时售罄', '已售罄'];
const MOCK_TRANSITIONS = {
  '预售中': ['预售中', '预售中', '暂时售罄', '暂时售罄', '已售罄'],
  '暂时售罄': ['暂时售罄', '预售中', '预售中', '已售罄'],
  '已售罄': ['已售罄', '已售罄', '已售罄', '暂时售罄'],
  '未开售': ['未开售', '预售中'],
  '已停售': ['已停售'],
  '不可售': ['不可售'],
};

function getMockData() {
  const screens = [
    {
      screenName: '2025-07-01 周三 10:30',
      tickets: [
        { id: 'mock-1-1', desc: '内场1280元' },
        { id: 'mock-1-2', desc: '看台980元' },
        { id: 'mock-1-3', desc: '看台680元' },
        { id: 'mock-1-4', desc: '看台480元' },
      ],
    },
    {
      screenName: '2025-07-02 周四 10:30',
      tickets: [
        { id: 'mock-2-1', desc: '内场1280元' },
        { id: 'mock-2-2', desc: '看台980元' },
        { id: 'mock-2-3', desc: '看台680元' },
      ],
    },
  ];

  const screenData = screens.map(screen => {
    const tickets = screen.tickets.map(ticket => {
      if (!mockTicketStates[ticket.id]) {
        mockTicketStates[ticket.id] = '预售中';
      }
      // ~30% 概率发生状态变化
      if (Math.random() < 0.3) {
        const possible = MOCK_TRANSITIONS[mockTicketStates[ticket.id]] || [mockTicketStates[ticket.id]];
        mockTicketStates[ticket.id] = possible[Math.floor(Math.random() * possible.length)];
      }
      return {
        id: ticket.id,
        name: `${screen.screenName} ${ticket.desc}`,
        screenName: screen.screenName,
        desc: ticket.desc,
        status: mockTicketStates[ticket.id],
        statusNum: 0,
        price: '',
        saleFlag: {},
      };
    });
    return { screenName: screen.screenName, tickets };
  });

  const allTickets = screenData.flatMap(s => s.tickets);
  return {
    name: '【模拟】2026 XX漫展',
    screens: screenData,
    allTickets,
    stats: {
      total: allTickets.length,
      soldOut: allTickets.filter(t => t.status === '已售罄').length,
      tempSoldOut: allTickets.filter(t => t.status === '暂时售罄').length,
      onSale: allTickets.filter(t => t.status === '预售中').length,
      notStarted: allTickets.filter(t => t.status === '未开售').length,
      stopped: allTickets.filter(t => t.status === '已停售').length,
      unavailable: allTickets.filter(t => t.status === '不可售').length,
    },
    timestamp: new Date().toISOString(),
  };
}

app.get('/api/mock/:id', (req, res) => {
  res.json(getMockData());
});

// 生产环境：提供静态文件
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).json({ status: 'API server running' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🎫 B站余票监控后端已启动: http://localhost:${PORT}`);
  console.log(`📡 前端页面: http://localhost:${PORT}`);
});
