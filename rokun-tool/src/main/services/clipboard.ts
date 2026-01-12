/**
 * 剪贴板服务
 *
 * 为插件提供剪贴板访问功能
 */

import { clipboard, nativeImage } from 'electron'

export interface ClipboardData {
  text?: string
  image?: Buffer
  html?: string
}

export class ClipboardService {
  private allowRead: boolean = true
  private allowWrite: boolean = true

  constructor(allowRead: boolean = true, allowWrite: boolean = true) {
    this.allowRead = allowRead
    this.allowWrite = allowWrite
  }

  setPermissions(allowRead: boolean, allowWrite: boolean): void {
    this.allowRead = allowRead
    this.allowWrite = allowWrite
  }

  async readText(): Promise<string> {
    if (!this.allowRead) {
      throw new Error('Clipboard read permission denied')
    }

    return clipboard.readText()
  }

  async writeText(text: string): Promise<void> {
    if (!this.allowWrite) {
      throw new Error('Clipboard write permission denied')
    }

    clipboard.writeText(text)
  }

  async readImage(): Promise<Buffer> {
    if (!this.allowRead) {
      throw new Error('Clipboard read permission denied')
    }

    const image = clipboard.readImage()
    return image.toPNG()
  }

  async writeImage(buffer: Buffer): Promise<void> {
    if (!this.allowWrite) {
      throw new Error('Clipboard write permission denied')
    }

    const image = nativeImage.createFromBuffer(buffer)
    clipboard.writeImage(image)
  }

  async readHTML(): Promise<string> {
    if (!this.allowRead) {
      throw new Error('Clipboard read permission denied')
    }

    return clipboard.readHTML()
  }

  async writeHTML(html: string, text?: string): Promise<void> {
    if (!this.allowWrite) {
      throw new Error('Clipboard write permission denied')
    }

    if (text) {
      clipboard.write({ text, html })
    } else {
      clipboard.writeHTML(html)
    }
  }

  async clear(): Promise<void> {
    if (!this.allowWrite) {
      throw new Error('Clipboard write permission denied')
    }

    clipboard.clear()
  }

  async readAvailableFormats(): Promise<string[]> {
    if (!this.allowRead) {
      throw new Error('Clipboard read permission denied')
    }

    return clipboard.availableFormats()
  }

  hasText(): boolean {
    return clipboard.has('text/plain')
  }

  hasImage(): boolean {
    return clipboard.has('image/png')
  }

  hasHTML(): boolean {
    return clipboard.has('text/html')
  }
}
