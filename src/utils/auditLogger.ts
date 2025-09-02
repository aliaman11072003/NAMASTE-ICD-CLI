import { AuditLog } from '../models';

export class AuditLogger {
  private static instance: AuditLogger;
  private currentUser: string = 'system';

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  public setUser(user: string): void {
    this.currentUser = user;
  }

  public async log(
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: any,
    ipAddress?: string
  ): Promise<void> {
    try {
      await AuditLog.create({
        user: this.currentUser,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log audit trail:', error);
      // Don't throw error as audit logging failure shouldn't break main functionality
    }
  }

  public async logIngest(
    resourceType: string,
    count: number,
    source: string
  ): Promise<void> {
    await this.log(
      'ingest',
      resourceType,
      undefined,
      { count, source, timestamp: new Date() }
    );
  }

  public async logSearch(
    query: string,
    results: number
  ): Promise<void> {
    await this.log(
      'search',
      'search',
      undefined,
      { query, results, timestamp: new Date() }
    );
  }

  public async logMapping(
    namasteCode: string,
    icdCode: string,
    icdType: string
  ): Promise<void> {
    await this.log(
      'map_code',
      'concept_map',
      `${namasteCode}-${icdCode}`,
      { namasteCode, icdCode, icdType, timestamp: new Date() }
    );
  }

  public async logTranslation(
    namasteCode: string,
    mappings: number
  ): Promise<void> {
    await this.log(
      'translate',
      'concept_map',
      namasteCode,
      { namasteCode, mappings, timestamp: new Date() }
    );
  }

  public async logEncounterUpload(
    encounterId: string,
    patientId: string,
    problems: number
  ): Promise<void> {
    await this.log(
      'upload_encounter',
      'encounter',
      encounterId,
      { encounterId, patientId, problems, timestamp: new Date() }
    );
  }

  public async logError(
    action: string,
    error: string,
    resourceType?: string,
    resourceId?: string
  ): Promise<void> {
    await this.log(
      'error',
      resourceType,
      resourceId,
      { action, error, timestamp: new Date() }
    );
  }
}

export default AuditLogger.getInstance();
