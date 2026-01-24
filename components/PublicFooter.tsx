const footerColumns = [
  {
    title: "VĂN PHÒNG GIAO DỊCH",
    items: ["Trang chủ", "Giới thiệu", "Sản phẩm", "Tin tức", "Liên hệ"],
  },
  {
    title: "VỀ CHÚNG TÔI",
    items: ["Tìm kiếm", "Giới thiệu"],
  },
  {
    title: "CHÍNH SÁCH BÁN HÀNG",
    items: [
      "Chính sách bảo mật",
      "Chính sách vận chuyển",
      "Chính sách đổi trả",
      "Quy định sử dụng",
    ],
  },
  {
    title: "THEO DÕI CHÚNG TÔI",
    items: [
      "Hướng dẫn mua hàng",
      "Hướng dẫn thanh toán",
      "Hướng dẫn giao nhận",
      "Điều khoản dịch vụ",
    ],
  },
];

const PublicFooter = () => {
  return (
    <footer className="mt-10 bg-[#7cc242] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:justify-between">
        {footerColumns.map((column) => (
          <div key={column.title} className="space-y-3 text-sm">
            <h3 className="text-base font-semibold uppercase tracking-wide">
              {column.title}
            </h3>
            <ul className="space-y-2">
              {column.items.map((item) => (
                <li key={item} className="text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
};

export default PublicFooter;


