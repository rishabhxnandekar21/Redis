import express from "express";
import Redis from "ioredis";

const app = express();

app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

function otpKey(phone) {
  return `otp:${phone}`;
}

app.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP

  await redis.set(otpKey(phone), otp, "EX", 30); // Store OTP in Redis with a TTL of 5 minutes

  res.json({ message: "OTP sent successfully", otp });
});

app.post("/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;
  const storedOtp = await redis.get(otpKey(phone));

  if (!storedOtp) {
    return res.status(400).json({ message: "OTP expired or not found" });
  }

  if (storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  } else {
    await redis.del(otpKey(phone)); // Delete OTP after successful verification
    res.json({ message: "OTP verified successfully" });
  }
});

app.get("/otp/:phone/ttl", async (req, res) => {
  const ttl = await redis.ttl(otpKey(req.params.phone));
  res.json({ ttl });
});

app.listen(3000, () => {
  console.log("Server is running on port http://localhost:3000");
});
