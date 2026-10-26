# Mongoose Singleton Pattern - Model Registration Solution

## Problem

When multiple parts of an application (API and modules) import Mongoose independently, they can end up with separate instances of Mongoose. This causes:

1. **Duplicate Model Registration**: Models registered in one instance aren't available in another
2. **Database Operation Failures**: Queries fail with "Model not found" errors
3. **Buffering Timeouts**: Operations buffer waiting for models that appear unavailable
4. **Inconsistent State**: Each instance has its own connection and models registry

**Root Cause**: Each `require('mongoose')` call can return a different instance, especially in monorepo structures with npm workspaces where modules are in separate directories.

## Solution: Shared Mongoose Singleton

All modules must import Mongoose from a **single, centralized location** to ensure they all use the same instance and share the same model registry.

### Implementation

**File**: `/apps/api/utils/mongooseSingleton.js`

```javascript
/**
 * Shared mongoose instance to ensure all models register in the same connection.
 * All modules must import mongoose from this file instead of requiring 'mongoose' directly.
 */
module.exports = require('mongoose');
```

This single file is the **single source of truth** for the mongoose instance.

### How to Use in Modules

**Before** (Incorrect - each module had separate mongoose instance):
```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const model = new Schema({...});
module.exports = mongoose.model('warranty', model);
```

**After** (Correct - all modules share the same instance):
```javascript
const mongoose = require('../../../api/utils/mongooseSingleton');
const Schema = mongoose.Schema;

const model = new Schema({...});
module.exports = mongoose.model('warranty', model);
```

### Files Modified

The following files were updated to use the shared singleton:

1. **Module Models** (register schemas):
   - `/apps/modules/garantie-aquila/models/garantie.js`
   - `/apps/modules/garantie-aquila/models/garantie-config.js`
   - `/apps/modules/questions-reponses-aquila/models/questions.js`

2. **Module Services** (use models):
   - `/apps/modules/questions-reponses-aquila/services/questions.js`

3. **Module Initialization** (database access):
   - `/apps/modules/garantie-aquila/initAfter.js`

## Verification

After startup, all models should appear in a **single** `mongoose.models` registry:

```javascript
console.log(mongoose.models);
// Output shows:
{
  // API models
  modules: Model { modules },
  users: Model { users },
  products: Model { products },
  // ... API models ...

  // Module models (same registry!)
  warranty: Model { warranty },
  questions: Model { questions },
  // ... Module models ...
}
```

## Adding New Module Models

When creating new models in modules:

1. **Import from singleton**, NOT from npm:
   ```javascript
   const mongoose = require('../../../api/utils/mongooseSingleton');
   ```

2. **Create and export model normally**:
   ```javascript
   const model = new mongoose.Schema({...});
   module.exports = mongoose.model('mymodel', model);
   ```

3. **Use in services** - also import from singleton:
   ```javascript
   const mongoose = require('../../../api/utils/mongooseSingleton');
   // Access mongoose.models to verify model is registered
   ```

## Benefits

✅ **Single Connection**: All models use the same MongoDB connection
✅ **Unified Registry**: All models accessible via `mongoose.models`
✅ **No Buffering Timeouts**: Models are found immediately
✅ **Reliable Queries**: QueryBuilder and services can find all models
✅ **Easy to Debug**: Can inspect `mongoose.models` to verify state

## Path Reference

The relative path `../../../api/utils/mongooseSingleton` works from module files because:
```
apps/
├── api/
│   └── utils/
│       └── mongooseSingleton.js  ← Singleton
└── modules/
    └── your-module/
        ├── models/
        │   └── file.js           ← Use require('../../../api/utils/mongooseSingleton')
        └── services/
            └── file.js           ← Use require('../../../api/utils/mongooseSingleton')
```

## Troubleshooting

**Issue**: Models from modules not visible in `mongoose.models`
- **Cause**: Module file imported 'mongoose' directly instead of singleton
- **Fix**: Change to `require('../../../api/utils/mongooseSingleton')`

**Issue**: "Model not found" errors in module services
- **Cause**: Service file using different mongoose instance
- **Fix**: Ensure service file imports singleton, not 'mongoose'

**Issue**: Duplicate model registration errors
- **Cause**: Model being registered in multiple instances
- **Fix**: Verify all imports point to singleton

---

**Created**: October 26, 2026
**Related Issues**: Mongoose buffering timeouts, duplicate model registration in monorepo
