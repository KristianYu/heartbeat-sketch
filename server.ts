import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = parseInt(process.env.PORT || "3000", 10);

    // In-memory "Redis" simulation
  const pairs = new Map<string, string>(); // userId -> partnerId
  const invitationCodes = new Map<string, string>(); // code -> creatorId
  const messages = new Map<string, any[]>(); // pairKey -> messages[]
  const userStatus = new Map<string, { online: boolean, lastSeen: number }>();
  const capsules = new Map<string, Map<string, string>>(); // userId -> Map<EmotionType, text>
  const profiles = new Map<string, { name: string; birthday: string }>(); // userId -> profile
  const pendingDisconnectRequests = new Map<string, string>(); // requesterId -> targetId

  // Helper to get pair key
  const getPairKey = (id1: string, id2: string) => [id1, id2].sort().join(":");

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Generate invitation code
  app.post("/api/pairing/generate", (req, res) => {
    const { userId } = req.body;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    invitationCodes.set(code, userId);
    // TTL 24h simulation
    setTimeout(() => invitationCodes.delete(code), 24 * 60 * 60 * 1000);
    res.json({ code });
  });

  // Join pairing
  app.post("/api/pairing/join", (req, res) => {
    const { userId, code } = req.body;
    const creatorId = invitationCodes.get(code);

    if (!creatorId) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    if (creatorId === userId) {
      return res.status(400).json({ error: "Cannot pair with yourself" });
    }

    // Establish 1-on-1 link
    pairs.set(userId, creatorId);
    pairs.set(creatorId, userId);
    invitationCodes.delete(code);

    res.json({ partnerId: creatorId });
  });

  // Profile API
  app.post("/api/profile", (req, res) => {
    const { userId, name, birthday } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    profiles.set(userId, { name: name || "", birthday: birthday || "" });
    res.json({ success: true });
  });

  app.get("/api/profile/:userId", (req, res) => {
    const profile = profiles.get(req.params.userId);
    res.json(profile || { name: "", birthday: "" });
  });

  app.get("/api/profile/partner/:userId", (req, res) => {
    const partnerId = pairs.get(req.params.userId);
    if (!partnerId) return res.json(null);
    const profile = profiles.get(partnerId);
    res.json(profile || { name: "", birthday: "" });
  });

  app.get("/api/stats/:userId", (req, res) => {
    const userId = req.params.userId;
    const partnerId = pairs.get(userId);
    let messageCount = 0;
    if (partnerId) {
      const pairKey = getPairKey(userId, partnerId);
      const msgs = messages.get(pairKey) || [];
      messageCount = msgs.filter((m: any) => m.senderId === userId).length;
    }
    res.json({ messageCount });
  });

  // Socket.io Logic
  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId as string;
    if (!userId) return;

    userStatus.set(userId, { online: true, lastSeen: Date.now() });
    socket.join(userId);

    const partnerId = pairs.get(userId);
    if (partnerId) {
      io.to(partnerId).emit("partner_status", { online: true });
      // Send the connecting user their partner's current status
      const partnerStatus = userStatus.get(partnerId);
      socket.emit("partner_status", { online: partnerStatus?.online || false });
    }

    socket.on("send_emotion", (data) => {
      const { type, text, timestamp, image } = data;
      const partnerId = pairs.get(userId);
      
      if (partnerId) {
        const pairKey = getPairKey(userId, partnerId);
        
        // 1. Send the original message to the partner
        const msg = { senderId: userId, type, text, timestamp, image };
        const history = messages.get(pairKey) || [];
        history.push(msg);
        messages.set(pairKey, history);
        io.to(partnerId).emit("receive_emotion", msg);

        // 2. Check if the RECIPIENT (partnerId) has a capsule for this emotion to send BACK to the sender (userId)
        const partnerCapsules = capsules.get(partnerId);
        if (partnerCapsules && partnerCapsules.has(type)) {
          const capsuleText = partnerCapsules.get(type);
          partnerCapsules.delete(type); // Single use
          
          const autoReply = {
            senderId: partnerId,
            type: type,
            text: "这是我为你预埋的温柔...",
            capsuleText: capsuleText,
            timestamp: Date.now()
          };
          
          // Send auto-reply back to the original sender
          socket.emit("receive_emotion", autoReply);
          // Also store in history
          history.push(autoReply);
          
          // Notify the capsule owner that it was triggered
          io.to(partnerId).emit("capsule_used", { type });
        }
      }
    });

    socket.on("store_capsule", (data) => {
      const { type, text } = data;
      if (!capsules.has(userId)) {
        capsules.set(userId, new Map());
      }
      capsules.get(userId)!.set(type, text);
      socket.emit("capsule_stored", { type, text });
    });

    socket.on("get_capsules", () => {
      const userCapsules = capsules.get(userId);
      const data = userCapsules ? Object.fromEntries(userCapsules) : {};
      socket.emit("receive_capsules", data);
    });

    socket.on("get_history", () => {
      const partnerId = pairs.get(userId);
      if (partnerId) {
        const pairKey = getPairKey(userId, partnerId);
        const history = messages.get(pairKey) || [];
        socket.emit("receive_history", history);
      }
    });

    socket.on("view_history", () => {
      const partnerId = pairs.get(userId);
      if (partnerId) {
        io.to(partnerId).emit("partner_viewed_history");
      }
    });

    socket.on("request_disconnect", () => {
      const partnerId = pairs.get(userId);
      if (!partnerId) {
        socket.emit("disconnect_error", { error: "No partner found" });
        return;
      }
      pendingDisconnectRequests.set(userId, partnerId);
      io.to(partnerId).emit("disconnect_requested", { fromUserId: userId });
    });

    socket.on("respond_disconnect", ({ accept }: { accept: boolean }) => {
      // Find who requested disconnect with this user as target
      let requesterId: string | null = null;
      for (const [reqId, targetId] of pendingDisconnectRequests) {
        if (targetId === userId) {
          requesterId = reqId;
          break;
        }
      }
      if (!requesterId) return;

      pendingDisconnectRequests.delete(requesterId);

      if (accept) {
        // Clear pairing for both
        const partnerId = pairs.get(userId);
        if (partnerId) {
          pairs.delete(userId);
          pairs.delete(partnerId);
        }

        io.to(userId).emit("disconnected");
        io.to(requesterId).emit("disconnected");
      } else {
        io.to(requesterId).emit("disconnect_rejected");
      }
    });

    socket.on("disconnect", () => {
      userStatus.set(userId, { online: false, lastSeen: Date.now() });
      const partnerId = pairs.get(userId);
      if (partnerId) {
        io.to(partnerId).emit("partner_status", { online: false });
      }
      // Clean up any pending disconnect requests from or to this user
      pendingDisconnectRequests.delete(userId);
      for (const [reqId, targetId] of pendingDisconnectRequests) {
        if (targetId === userId) {
          pendingDisconnectRequests.delete(reqId);
          break;
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
