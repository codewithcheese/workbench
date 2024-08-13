import type { MessageAttachment } from "$lib/chat-service.svelte";
import type { Service } from "@/database";
import { toast } from "svelte-french-toast";
import { readBlobAsDataURL } from "./util/blob";
import { compressImage } from "$lib/util/image";
import { nanoid } from "nanoid";
import { humanType } from "$lib/util/mime";

export class Attachment {
  id: string = nanoid(10);
  type: string;
  name: string;
  content: string;
  attributes: Record<string, any>;
  loading: boolean = $state(true);
  error: Error | undefined = $state(undefined);

  constructor(
    type: string,
    name: string,
    content: string = "",
    attributes: Record<string, any> = {},
  ) {
    this.type = type;
    this.name = name;
    this.content = content;
    if (content !== "") {
      this.loading = false;
    }
    this.attributes = attributes;
  }
}

export class AttachmentService {
  fileInput: HTMLInputElement | undefined;
  attachments: Attachment[] = $state([]);

  private services: Service[];

  constructor(services: Service[] = []) {
    this.services = services;
  }

  clear() {
    this.attachments = [];
  }

  remove = (index: number) => {
    this.attachments = this.attachments.filter((a, i) => i !== index);
  };

  handlePasteClick = () => {
    console.log("handlePasteClick");
  };

  handleUploadClick = () => {
    if (this.fileInput) {
      this.fileInput.click();
      this.fileInput.addEventListener("change", this.handleFileChange);
    } else {
      console.error("File input not found");
    }
  };

  handlePaste = (event: ClipboardEvent) => {
    if (!event.clipboardData) {
      return;
    }

    const content = event.clipboardData.getData("text/plain");
    if (content.length > 1000) {
      event.preventDefault();
      this.attachments.push(
        new Attachment("text/plain", `Pasted ${new Date().toLocaleString()}`, content),
      );
      return;
    }

    const results: any[] = [];
    const items = Array.from(event.clipboardData.items);
    for (const item of items) {
      console.log("item", item.kind, item.type);
      if (item.kind === "file") {
        results.push(this.handleFile(item.getAsFile()!));
      }
    }

    // Prevent default paste behavior if we handled any items
    if (results.some((result) => result)) {
      event.preventDefault();
    }
  };

  handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      return;
    }

    Array.from(target.files).forEach((file) => {
      this.handleFile(file);
    });

    // Reset the file input
    if (this.fileInput) {
      this.fileInput.value = "";
    }
  };

  private async handleFile(file: File) {
    let type: string = file.type;
    let name: string = file.name;

    const isComplex = !(type.startsWith("text/") || type.startsWith("image/"));
    if (isComplex && this.services.length === 0) {
      toast.error(
        `Document processing service required to process ${humanType(type)} files. Add API keys in the settings.`,
      );
      return;
    }

    const attachment = new Attachment(type, name);
    this.attachments.push(attachment);

    try {
      if (type.startsWith("text/")) {
        attachment.loading = false;
        attachment.content = await file.text();
        return attachment.content.length > 1000;
      } else if (type.startsWith("image/")) {
        await this.loadImage(file, attachment);
        return true;
      } else {
        await this.loadDocument(file, attachment);
        return true;
      }
    } catch (error) {
      console.error("Error processing file:", error);
      attachment.error =
        error instanceof Error ? error : new Error("Unknown error processing file");
    } finally {
      attachment.loading = false;
    }
  }

  private async loadImage(file: File, attachment: Attachment) {
    const originalSizeMB = file.size / (1024 * 1024);
    if (originalSizeMB > 10) {
      throw new Error(`Image too large: ${originalSizeMB.toFixed(2)} MB.`);
    }
    console.log(`Original image size: ${originalSizeMB.toFixed(2)} MB`);

    let blob: Blob = file;
    if (originalSizeMB > 0.5) {
      blob = await compressImage(file);
      const compressedSizeMB = blob.size / (1024 * 1024);
      toast.success(
        `Large image compressed from ${originalSizeMB.toFixed(2)} MB to ${compressedSizeMB.toFixed(2)} MB`,
      );
    }

    attachment.content = await readBlobAsDataURL(blob);
  }

  private async loadDocument(file: File, attachment: Attachment) {
    try {
      // TODO: use the document processor service key as the API key
      const data = await readBlobAsDataURL(file);
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "YOUR_API_KEY_HERE", // Replace with actual API key or fetch from environment
        },
        body: JSON.stringify({
          data,
          fileName: file.name,
          language: "eng", // You might want to make this configurable
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      attachment.content = JSON.stringify(result, null, 2);
      attachment.attributes.parsedContent = result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error");
    }
  }
}
