export function formatDate(date: Date | number | string, pattern = "YYYY-MM-DD HH:mm:ss"): string {
  const d = new Date(date);
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: String(d.getMonth() + 1).padStart(2, "0"),
    DD: String(d.getDate()).padStart(2, "0"),
    HH: String(d.getHours()).padStart(2, "0"),
    mm: String(d.getMinutes()).padStart(2, "0"),
    ss: String(d.getSeconds()).padStart(2, "0"),
  };
  return pattern.replace(/YYYY|MM|DD|HH|mm|ss/g, (m) => map[m]);
}

export function formatMoney(amount: number, currency = "￥"): string {
  return (
    currency +
    amount.toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function maskPhone(phone: string): string {
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain || name.length <= 2) return email;
  return `${name[0]}***@${domain}`;
}
