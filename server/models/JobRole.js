const mongoose = require("mongoose");
const jobRoleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            require: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        category: {
            type: Boolean,
            default: true,
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model("JobRole", jobRoleSchema);