#!/bin/bash
echo "Starting Makow Genealogy backend..."
cd backend && node server.js &
BACKEND_PID=$!

sleep 1

echo "Starting frontend server on port 3000..."
cd ../frontend && python3 -m http.server 3000 &
FRONTEND_PID=$!

echo ""
echo "============================================"
echo "  Makow Genealogy is running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:3001"
echo "  Admin login: admin@makow.com / admin123"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
