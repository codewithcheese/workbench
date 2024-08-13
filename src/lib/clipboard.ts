export async function getClipboardContent() {
  try {
    const content = await navigator.clipboard.readText();
    return { error: null, content };
  } catch (error) {
    console.error("Failed to read clipboard contents: ", error);
    return { error: "Failed to read clipboard contents" };
  }
}
