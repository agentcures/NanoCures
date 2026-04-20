export function personalizeClaudeTemplate(
  content: string,
  assistantName: string,
): string {
  return content
    .replace(
      /^#\s+.+?( Shared Memory)?$/m,
      (_match, sharedMemorySuffix: string | undefined) =>
        `# ${assistantName}${sharedMemorySuffix ?? ''}`,
    )
    .replace(/You are `[^`]+`/g, `You are \`${assistantName}\``)
    .replace(/\bYou are [A-Za-z0-9._-]+\b/g, `You are ${assistantName}`)
    .replace(
      /across [A-Za-z0-9._-]+ groups/g,
      `across ${assistantName} groups`,
    );
}
