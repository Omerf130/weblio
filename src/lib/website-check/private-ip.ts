import { isIP } from "node:net";

function ipv4ToUnsignedLong(ip: string): number {
  const parts = ip.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part) || part < 0 || part > 255)) {
    return 0;
  }
  return (
    (((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0) as number
  );
}

function isInRange(value: number, start: number, end: number): boolean {
  return value >= start && value <= end;
}

export function isPrivateOrReservedIPv4(ip: string): boolean {
  if (isIP(ip) !== 4) {
    return false;
  }

  const value = ipv4ToUnsignedLong(ip);

  return (
    isInRange(value, ipv4ToUnsignedLong("0.0.0.0"), ipv4ToUnsignedLong("0.255.255.255")) ||
    isInRange(value, ipv4ToUnsignedLong("10.0.0.0"), ipv4ToUnsignedLong("10.255.255.255")) ||
    isInRange(value, ipv4ToUnsignedLong("100.64.0.0"), ipv4ToUnsignedLong("100.127.255.255")) ||
    isInRange(value, ipv4ToUnsignedLong("127.0.0.0"), ipv4ToUnsignedLong("127.255.255.255")) ||
    isInRange(value, ipv4ToUnsignedLong("169.254.0.0"), ipv4ToUnsignedLong("169.254.255.255")) ||
    isInRange(value, ipv4ToUnsignedLong("172.16.0.0"), ipv4ToUnsignedLong("172.31.255.255")) ||
    isInRange(value, ipv4ToUnsignedLong("192.0.0.0"), ipv4ToUnsignedLong("192.0.0.255")) ||
    isInRange(value, ipv4ToUnsignedLong("192.0.2.0"), ipv4ToUnsignedLong("192.0.2.255")) ||
    isInRange(value, ipv4ToUnsignedLong("192.168.0.0"), ipv4ToUnsignedLong("192.168.255.255")) ||
    isInRange(value, ipv4ToUnsignedLong("198.18.0.0"), ipv4ToUnsignedLong("198.19.255.255")) ||
    isInRange(value, ipv4ToUnsignedLong("224.0.0.0"), ipv4ToUnsignedLong("239.255.255.255")) ||
    isInRange(value, ipv4ToUnsignedLong("240.0.0.0"), ipv4ToUnsignedLong("255.255.255.255"))
  );
}

function normalizeIPv6ForCheck(ip: string): string {
  return ip.trim().toLowerCase();
}

export function isPrivateOrReservedIPv6(ip: string): boolean {
  if (isIP(ip) !== 6) {
    return false;
  }

  const normalized = normalizeIPv6ForCheck(ip);

  if (normalized === "::" || normalized === "::1") {
    return true;
  }

  if (normalized.startsWith("fe80:")) {
    return true;
  }

  if (normalized.startsWith("fc00:") || normalized.startsWith("fd")) {
    return true;
  }

  if (normalized.startsWith("ff")) {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice("::ffff:".length);
    if (mapped.includes(".")) {
      return isPrivateOrReservedIPv4(mapped);
    }
  }

  return false;
}

export function isPrivateOrReservedIpHost(host: string): boolean {
  const trimmed = host.trim();
  if (!trimmed) {
    return true;
  }

  const withoutBrackets =
    trimmed.startsWith("[") && trimmed.endsWith("]") ? trimmed.slice(1, -1) : trimmed;

  const ipVersion = isIP(withoutBrackets);
  if (ipVersion === 4) {
    return isPrivateOrReservedIPv4(withoutBrackets);
  }
  if (ipVersion === 6) {
    return isPrivateOrReservedIPv6(withoutBrackets);
  }

  return false;
}
