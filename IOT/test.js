const mongoose = require("mongoose");

// Kết nối với database
const connection = mongoose.connect("mongodb+srv://vuphuong2002vnp:KPXgFqyDX97NZZn5@cluster0.hbx7g3l.mongodb.net/Practice?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Tạo model cho bảng events
const eventSchema = new mongoose.Schema({
  device_id: String,
  type: String,
  value: Number,
  created: Date,
});

const Event = mongoose.model("Event", eventSchema);

// Lấy tất cả document từ bảng events
Event.find((err, docs) => {
  if (err) {
    console.log(err);
    return;
  }

  // In kết quả
  console.log(docs);

  // Ngắt kết nối với database
  connection.close();
});