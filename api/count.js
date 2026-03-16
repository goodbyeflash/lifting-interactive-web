import { connectToDatabase } from './db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('LiftingSimDB');
    const collection = db.collection('visitors');

    const { uuid } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = new Date();

    // 1. 매 접속마다 갱신될 데이터
    const updateData = {
      ip,
      userAgent: req.headers['user-agent'],
      lastVisited: now, // 최근 접속 날짜 업데이트
    };

    // 2. 최초 접속 시에만 저장될 데이터
    const firstTimeData = {
      uuid,
      firstVisited: now, // 최초 접속 날짜 고정
    };

    const result = await collection.updateOne(
      { uuid },
      {
        $set: updateData, // 매번 덮어씀 (최근 정보 유지)
        $setOnInsert: firstTimeData, // 데이터가 처음 생성될 때만 삽입됨
      },
      { upsert: true }, // 없으면 새로 만들고 있으면 업데이트
    );

    return res.status(200).json({ success: true, status: result });
  } catch (error) {
    console.error('Database Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
