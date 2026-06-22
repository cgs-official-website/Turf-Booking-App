// const mongoose = require("mongoose");

// const planSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Plan name is required"],
//       trim: true,
//     },

//     description: {
//       type: String,
//       default: "",
//     },

//     price: {
//       type: Number,
//       required: [true, "Plan price is required"],
//       min: 0,
//     },

//     durationDays: {
//       type: Number,
//       required: [true, "Plan duration is required"],
//       min: 1,
//     },

//     features: {
//       maxTurfs: {
//         type: Number,
//         default: 1,
//       },
//       prioritySupport: {
//         type: Boolean,
//         default: false,
//       },
//       analyticsAccess: {
//         type: Boolean,
//         default: false,
//       },
//       bookingDiscountPercent: {
//         type: Number,
//         default: 0,
//         min: 0,
//         max: 100,
//       },
//     },

//     trialDays: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true }
// );

// const subscriptionSchema = new mongoose.Schema(
//   {
//     vendor: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: [true, "Vendor is required"],
//     },

//     plan: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Plan",
//       required: [true, "Plan is required"],
//     },

//     status: {
//       type: String,
//       enum: ["trial", "active", "expired", "cancelled", "pending"],
//       default: "pending",
//     },

//     startDate: {
//       type: Date,
//       required: true,
//     },

//     endDate: {
//       type: Date,
//       required: true,
//     },

//     trialEndDate: {
//       type: Date,
//       default: null,
//     },

//     isTrial: {
//       type: Boolean,
//       default: false,
//     },

//     autoRenew: {
//       type: Boolean,
//       default: false,
//     },

//     paymentStatus: {
//       type: String,
//       enum: ["pending", "paid", "failed", "refunded"],
//       default: "pending",
//     },

//     amountPaid: {
//       type: Number,
//       default: 0,
//     },

//     previousPlan: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Plan",
//       default: null,
//     },

//     upgradeDowngradeDate: {
//       type: Date,
//       default: null,
//     },

//     cancelledAt: {
//       type: Date,
//       default: null,
//     },

//     cancelReason: {
//       type: String,
//       default: "",
//     },

//     expiryAlertSentAt: {
//       type: Date,
//       default: null,
//     },
//   },
//   { timestamps: true }
// );

// // Virtual: days remaining
// subscriptionSchema.virtual("daysRemaining").get(function () {
//   if (!this.endDate) return 0;
//   const diff = this.endDate - new Date();
//   return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
// });

// subscriptionSchema.set("toJSON", { virtuals: true });
// subscriptionSchema.set("toObject", { virtuals: true });

// const Plan = mongoose.model("Plan", planSchema);
// const Subscription = mongoose.model("Subscription", subscriptionSchema);

// module.exports = { Plan, Subscription };

const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: [true, "Plan price is required"],
      min: 0,
    },

    durationDays: {
      type: Number,
      required: [true, "Plan duration is required"],
      min: 1,
    },

    features: {
      maxTurfs: {
        type: Number,
        default: 1,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      analyticsAccess: {
        type: Boolean,
        default: false,
      },
      bookingDiscountPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },

    // Free-text feature bullets shown on the pricing card / EditPlans UI.
    // Kept separate from the structured `features` object above so the
    // admin can add arbitrary marketing copy without touching the
    // structured entitlement flags used elsewhere in the app.
    featureList: {
      type: [String],
      default: [],
    },

    // Marks this plan as the "Most Popular" plan shown on the pricing page.
    isMostPopular: {
      type: Boolean,
      default: false,
    },

    trialDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const subscriptionSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vendor is required"],
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: [true, "Plan is required"],
    },

    status: {
      type: String,
      enum: ["trial", "active", "expired", "cancelled", "pending"],
      default: "pending",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    trialEndDate: {
      type: Date,
      default: null,
    },

    isTrial: {
      type: Boolean,
      default: false,
    },

    autoRenew: {
      type: Boolean,
      default: false,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    previousPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      default: null,
    },

    upgradeDowngradeDate: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelReason: {
      type: String,
      default: "",
    },

    expiryAlertSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Virtual: days remaining
subscriptionSchema.virtual("daysRemaining").get(function () {
  if (!this.endDate) return 0;
  const diff = this.endDate - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

subscriptionSchema.set("toJSON", { virtuals: true });
subscriptionSchema.set("toObject", { virtuals: true });

const Plan = mongoose.model("Plan", planSchema);
const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = { Plan, Subscription };