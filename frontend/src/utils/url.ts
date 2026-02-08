/**
 * 生成完整的短链URL
 * @param shortCode - 短码
 * @returns 完整的短链URL
 */
export function getShortLinkUrl(shortCode: string): string {
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  return `${baseUrl}/${shortCode}`;
}
