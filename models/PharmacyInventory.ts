import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPharmacyInventory extends Document {
  medicineName: string
  genericName?: string
  category: string
  manufacturer: string
  batchNumber: string
  expiryDate: Date
  quantity: number
  unitPrice: number
  reorderLevel: number
  isLowStock: boolean
  description?: string
  sideEffects?: string[]
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const PharmacyInventorySchema: Schema = new Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      required: true,
      min: 0,
      default: 10,
    },
    isLowStock: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
    },
    sideEffects: [{ type: String }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

PharmacyInventorySchema.pre('save', function (next) {
  this.isLowStock = (this.quantity as number) <= (this.reorderLevel as number)
  next()
})

PharmacyInventorySchema.index({ medicineName: 1, batchNumber: 1 })
PharmacyInventorySchema.index({ isLowStock: 1 })

const PharmacyInventory: Model<IPharmacyInventory> =
  mongoose.models.PharmacyInventory ||
  mongoose.model<IPharmacyInventory>('PharmacyInventory', PharmacyInventorySchema)

export default PharmacyInventory
