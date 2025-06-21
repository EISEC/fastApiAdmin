import apiClient from '../lib/axios.config';
import type {
  ImportSource,
  ImportJob,
  ImportMapping,
  ImportLog,
  CreateImportJobData,
  WordPressImportData,
  WordPressPreviewData,
  ImportStats,
  ImportJobListItem,
  ImportSourceListItem
} from '../types/import.types';

export class ImportService {
  // Источники импорта
  static async getSources(): Promise<ImportSourceListItem[]> {
    const response = await apiClient.get('/import-export/sources/');
    return response.data.results || response.data;
  }

  static async getSource(id: number): Promise<ImportSource> {
    const response = await apiClient.get(`/import-export/sources/${id}/`);
    return response.data;
  }

  static async createSource(data: Partial<ImportSource>): Promise<ImportSource> {
    const response = await apiClient.post('/import-export/sources/', data);
    return response.data;
  }

  static async updateSource(id: number, data: Partial<ImportSource>): Promise<ImportSource> {
    const response = await apiClient.put(`/import-export/sources/${id}/`, data);
    return response.data;
  }

  static async deleteSource(id: number): Promise<void> {
    await apiClient.delete(`/import-export/sources/${id}/`);
  }

  // Задачи импорта
  static async getJobs(): Promise<ImportJobListItem[]> {
    const response = await apiClient.get('/import-export/jobs/');
    return response.data.results || response.data;
  }

  static async getJob(id: number): Promise<ImportJob> {
    const response = await apiClient.get(`/import-export/jobs/${id}/`);
    return response.data;
  }

  static async createJob(data: CreateImportJobData): Promise<ImportJob> {
    const response = await apiClient.post('/import-export/jobs/', data);
    return response.data;
  }

  static async updateJob(id: number, data: Partial<ImportJob>): Promise<ImportJob> {
    const response = await apiClient.put(`/import-export/jobs/${id}/`, data);
    return response.data;
  }

  static async deleteJob(id: number): Promise<void> {
    await apiClient.delete(`/import-export/jobs/${id}/`);
  }

  // Управление задачами
  static async startJob(id: number): Promise<{ message: string; job_id: number; status: string }> {
    const response = await apiClient.post(`/import-export/jobs/${id}/start/`);
    return response.data;
  }

  static async cancelJob(id: number): Promise<{ message: string; job_id: number; status: string }> {
    const response = await apiClient.post(`/import-export/jobs/${id}/cancel/`);
    return response.data;
  }

  static async getJobStats(id: number): Promise<ImportStats> {
    const response = await apiClient.get(`/import-export/jobs/${id}/stats/`);
    return response.data;
  }

  static async getJobLogs(id: number): Promise<ImportLog[]> {
    const response = await apiClient.get(`/import-export/jobs/${id}/logs/`);
    return response.data.results || response.data;
  }

  static async cleanupJob(id: number): Promise<{ message: string; deleted: { posts: number; pages: number; total: number } }> {
    const response = await apiClient.post(`/import-export/jobs/${id}/cleanup/`);
    return response.data;
  }

  // WordPress импорт
  static async wordpressImport(data: WordPressImportData): Promise<ImportJob> {
    const formData = new FormData();
    
    formData.append('name', data.name);
    formData.append('target_site', data.target_site.toString());
    
    // Определяем тип источника данных
    const sourceType = data.file ? 'file' : (data.api_url ? 'api' : 'file');
    formData.append('source_type', sourceType);
    
    // Добавляем файл с правильным именем поля
    if (data.file) {
      formData.append('source_file', data.file);
    }
    
    // API данные
    if (data.api_url) {
      formData.append('wordpress_url', data.api_url);
    }
    
    if (data.api_username) {
      formData.append('api_username', data.api_username);
    }
    
    if (data.api_password) {
      formData.append('api_password', data.api_password);
    }
    
    // Настройки импорта
    formData.append('import_posts', data.config.import_posts ? 'true' : 'false');
    formData.append('import_pages', data.config.import_pages ? 'true' : 'false');
    formData.append('import_categories', data.config.import_categories ? 'true' : 'false');
    formData.append('import_tags', data.config.import_tags ? 'true' : 'false');
    formData.append('import_media', data.config.import_media ? 'true' : 'false');
    formData.append('update_existing', data.config.update_existing ? 'true' : 'false');

    const response = await apiClient.post('/import-export/jobs/wordpress_import/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  static async wordpressPreview(file: File): Promise<WordPressPreviewData> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/import-export/jobs/wordpress_preview/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  // Маппинг полей
  static async getMappings(jobId?: number): Promise<ImportMapping[]> {
    const params = jobId ? { job_id: jobId } : {};
    const response = await apiClient.get('/import-export/mappings/', { params });
    return response.data.results || response.data;
  }

  static async getMapping(id: number): Promise<ImportMapping> {
    const response = await apiClient.get(`/import-export/mappings/${id}/`);
    return response.data;
  }

  static async createMapping(data: Partial<ImportMapping>): Promise<ImportMapping> {
    const response = await apiClient.post('/import-export/mappings/', data);
    return response.data;
  }

  static async updateMapping(id: number, data: Partial<ImportMapping>): Promise<ImportMapping> {
    const response = await apiClient.put(`/import-export/mappings/${id}/`, data);
    return response.data;
  }

  static async deleteMapping(id: number): Promise<void> {
    await apiClient.delete(`/import-export/mappings/${id}/`);
  }

  // Логи импорта
  static async getLogs(jobId?: number): Promise<ImportLog[]> {
    const params = jobId ? { job_id: jobId } : {};
    const response = await apiClient.get('/import-export/logs/', { params });
    return response.data.results || response.data;
  }

  static async getLog(id: number): Promise<ImportLog> {
    const response = await apiClient.get(`/import-export/logs/${id}/`);
    return response.data;
  }
}

export default ImportService; 