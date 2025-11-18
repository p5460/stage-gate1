interface SharePointConfig {
  siteUrl: string;
  clientId: string;
  clientSecret: string;
}

interface SharePointFile {
  id: string;
  name: string;
  size: number;
  url: string;
  downloadUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  mimeType: string;
}

class SharePointService {
  private config: SharePointConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = {
      siteUrl: process.env.SHAREPOINT_SITE_URL!,
      clientId: process.env.SHAREPOINT_CLIENT_ID!,
      clientSecret: process.env.SHAREPOINT_CLIENT_SECRET!,
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const tenantId = this.extractTenantId(this.config.siteUrl);
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000); // Subtract 60 seconds for safety

    return this.accessToken!;
  }

  private extractTenantId(siteUrl: string): string {
    // Extract tenant ID from SharePoint URL
    // This is a simplified version - you might need to adjust based on your SharePoint setup
    const match = siteUrl.match(/https:\/\/([^.]+)\.sharepoint\.com/);
    if (!match) {
      throw new Error("Invalid SharePoint site URL");
    }
    return match[1];
  }

  private async makeGraphRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<unknown> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://graph.microsoft.com/v1.0${endpoint}`,
      {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`SharePoint API error: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadFile(
    projectId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<SharePointFile> {
    try {
      const folderPath = `/sites/stage-gate/Shared Documents/Projects/${projectId}`;

      // Create folder if it doesn't exist
      await this.createFolder(folderPath);

      const uploadUrl = `/sites/stage-gate/drive/root:${folderPath}/${fileName}:/content`;

      const token = await this.getAccessToken();

      const response = await fetch(
        `https://graph.microsoft.com/v1.0${uploadUrl}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": mimeType,
          },
          body: new Uint8Array(fileBuffer),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }

      const fileData = (await response.json()) as Record<string, unknown>;

      return {
        id: fileData.id as string,
        name: fileData.name as string,
        size: fileData.size as number,
        url: fileData.webUrl as string,
        downloadUrl: fileData["@microsoft.graph.downloadUrl"] as string,
        createdDateTime: fileData.createdDateTime as string,
        lastModifiedDateTime: fileData.lastModifiedDateTime as string,
        mimeType: (fileData.file as any)?.mimeType || mimeType,
      };
    } catch (error) {
      console.error("SharePoint upload error:", error);
      throw new Error("Failed to upload file to SharePoint");
    }
  }

  async createFolder(folderPath: string): Promise<void> {
    try {
      const pathParts = folderPath.split("/").filter(Boolean);
      let currentPath = "";

      for (const part of pathParts) {
        currentPath += `/${part}`;

        try {
          await this.makeGraphRequest(
            `/sites/stage-gate/drive/root:${currentPath}`
          );
        } catch {
          // Folder doesn't exist, create it
          const parentPath =
            currentPath.substring(0, currentPath.lastIndexOf("/")) || "/";
          await this.makeGraphRequest(
            `/sites/stage-gate/drive/root:${parentPath}:/children`,
            {
              method: "POST",
              body: JSON.stringify({
                name: part,
                folder: {},
                "@microsoft.graph.conflictBehavior": "rename",
              }),
            }
          );
        }
      }
    } catch (error) {
      console.error("SharePoint folder creation error:", error);
      // Don't throw error for folder creation - file upload might still work
    }
  }

  async getFile(fileId: string): Promise<SharePointFile> {
    try {
      const fileData = (await this.makeGraphRequest(
        `/sites/stage-gate/drive/items/${fileId}`
      )) as Record<string, unknown>;

      return {
        id: fileData.id as string,
        name: fileData.name as string,
        size: fileData.size as number,
        url: fileData.webUrl as string,
        downloadUrl: fileData["@microsoft.graph.downloadUrl"] as string,
        createdDateTime: fileData.createdDateTime as string,
        lastModifiedDateTime: fileData.lastModifiedDateTime as string,
        mimeType:
          (fileData.file as any)?.mimeType || "application/octet-stream",
      };
    } catch (error) {
      console.error("SharePoint get file error:", error);
      throw new Error("Failed to get file from SharePoint");
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.makeGraphRequest(`/sites/stage-gate/drive/items/${fileId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("SharePoint delete file error:", error);
      throw new Error("Failed to delete file from SharePoint");
    }
  }

  async listProjectFiles(projectId: string): Promise<SharePointFile[]> {
    try {
      const folderPath = `/sites/stage-gate/Shared Documents/Projects/${projectId}`;
      const response = await this.makeGraphRequest(
        `/sites/stage-gate/drive/root:${folderPath}:/children`
      );

      return (response as { value: Record<string, unknown>[] }).value.map(
        (item: Record<string, unknown>): SharePointFile => ({
          id: item.id as string,
          name: item.name as string,
          size: item.size as number,
          url: item.webUrl as string,
          downloadUrl: item["@microsoft.graph.downloadUrl"] as string,
          createdDateTime: item.createdDateTime as string,
          lastModifiedDateTime: item.lastModifiedDateTime as string,
          mimeType: (item.file as any)?.mimeType || "application/octet-stream",
        })
      );
    } catch (error) {
      console.error("SharePoint list files error:", error);
      return []; // Return empty array if folder doesn't exist or other error
    }
  }
}

export const sharePointService = new SharePointService();
export type { SharePointFile };
