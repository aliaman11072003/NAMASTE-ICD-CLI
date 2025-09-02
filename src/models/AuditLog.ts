import mongoose, { Schema, Document } from 'mongoose';
import { AuditLog as IAuditLog } from '../types';

export interface AuditLogDocument extends Omit<IAuditLog, '_id'>, Document {}

const AuditLogSchema = new Schema<AuditLogDocument>({
  user: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  resourceType: {
    type: String,
    trim: true
  },
  resourceId: {
    type: String,
    trim: true
  },
  details: {
    type: Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  ipAddress: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

// Create indexes for better search performance
AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ timestamp: -1 });

// TTL index to automatically delete old logs (keep for 1 year)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

// Virtual for formatted timestamp
AuditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Ensure virtuals are serialized
AuditLogSchema.set('toJSON', { virtuals: true });
AuditLogSchema.set('toObject', { virtuals: true });

export default mongoose.model<AuditLogDocument>('AuditLog', AuditLogSchema);
