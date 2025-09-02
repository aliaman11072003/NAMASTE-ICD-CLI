import mongoose, { Schema, Document } from 'mongoose';
import { Encounter as IEncounter, Problem } from '../types';

export interface EncounterDocument extends Omit<IEncounter, '_id'>, Document {}

const ProblemSchema = new Schema({
  namasteCode: {
    type: String,
    trim: true
  },
  icdCode: {
    type: String,
    trim: true
  },
  icdType: {
    type: String,
    enum: ['TM2', 'Biomedicine']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    default: 'moderate'
  },
  onsetDate: {
    type: Date
  }
}, { _id: false });

const EncounterSchema = new Schema<EncounterDocument>({
  encounterId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  patientId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  problems: {
    type: [ProblemSchema],
    required: true,
    validate: {
      validator: function(problems: any[]) {
        return problems.length > 0;
      },
      message: 'At least one problem must be specified'
    }
  },
  encounterDate: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'encounters'
});

// Create indexes for better search performance
EncounterSchema.index({ patientId: 1, encounterDate: -1 });
EncounterSchema.index({ encounterDate: -1 });
EncounterSchema.index({ 'problems.namasteCode': 1 });
EncounterSchema.index({ 'problems.icdCode': 1 });
EncounterSchema.index({ createdAt: -1 });

// Virtual for FHIR Encounter
EncounterSchema.virtual('fhirEncounter').get(function(this: any) {
  return {
    resourceType: 'Encounter',
    id: this.encounterId,
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory'
    },
    subject: {
      reference: `Patient/${this.patientId}`
    },
    period: {
      start: this.encounterDate.toISOString()
    },
    diagnosis: this.problems.map((problem: any, index: number) => ({
      condition: {
        reference: `Condition/${this.encounterId}-${index + 1}`
      },
      rank: index + 1
    }))
  };
});

// Ensure virtuals are serialized
EncounterSchema.set('toJSON', { virtuals: true });
EncounterSchema.set('toObject', { virtuals: true });

export default mongoose.model<EncounterDocument>('Encounter', EncounterSchema);
