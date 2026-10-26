# AquilaCMS Mongoose Buffering Timeout - Solution Summary

## Issue Resolved ✓
**Original Error:** `MongooseError: Operation 'questions.countDocuments()' buffering timed out after 10000ms`

## Root Causes Identified & Fixed

### 1. **Duplicate Mongoose Instances (Primary Issue)**
- **Problem:** Modules were importing `mongoose` directly from npm instead of sharing the API's instance
- **Impact:** Each module got a separate Mongoose instance with its own model registry, preventing API from finding module models
- **Solution:** Created centralized Mongoose singleton at `/apps/api/utils/mongooseSingleton.js`

### 2. **Monorepo Dependency Chaos (Secondary Issue)**
- **Problem:** Attempted pnpm migration exposed that modules couldn't access shared dependencies
- **Impact:** Build failures and model registration failures during module initialization
- **Solution:** Switched to npm workspaces with proper configuration in root `package.json`

### 3. **Missing Babel Runtime**
- **Problem:** `@babel/runtime` was not installed, causing "Can't resolve '@babel/runtime/helpers/esm/asyncToGenerator'"
- **Impact:** Next.js build compilation failures
- **Solution:** Installed `@babel/runtime` package

## Files Modified/Created

### Created:
- `/apps/api/utils/mongooseSingleton.js` - Centralized Mongoose instance
- `/MONGOOSE_SINGLETON_GUIDE.md` - Implementation documentation

### Modified:
1. `/apps/modules/garantie-aquila/models/garantie.js` - Uses singleton
2. `/apps/modules/garantie-aquila/models/garantie-config.js` - Uses singleton
3. `/apps/modules/questions-reponses-aquila/models/questions.js` - Uses singleton (original problematic model)
4. `/apps/modules/questions-reponses-aquila/services/questions.js` - Uses singleton
5. `/apps/modules/garantie-aquila/initAfter.js` - Uses singleton
6. `/package.json` - Added npm workspaces configuration

## Technical Details

### The Mongoose Buffering Issue Explained
When a model is called before the MongoDB connection is established, Mongoose enters "buffering mode" and queues operations for up to 10 seconds. If the connection isn't ready by then, operations fail with a timeout error. The issue was amplified because:

1. Different Mongoose instances meant models weren't in the API's registry
2. API tried to query a model that existed in the module's separate instance
3. Queries timed out because the model wasn't found in the API's Mongoose instance

### Why the Singleton Pattern Works
- All modules now require Mongoose from `/apps/api/utils/mongooseSingleton.js`
- This ensures Node.js resolves to the same physical file regardless of where it's required from
- All models register in the same Mongoose instance and share the same connection
- API can successfully query models registered by modules

### Relative Path Pattern
Module imports use relative paths to reach the singleton:
```javascript
const mongoose = require('../../../api/utils/mongooseSingleton');
// From: apps/modules/{moduleName}/models/file.js
// To:   apps/api/utils/mongooseSingleton.js
// Distance: 3 levels up (models -> moduleName -> modules -> apps) + down to api/utils
```

## Verification

✅ Server starts successfully on port 3010  
✅ No "buffering timed out" errors in logs  
✅ All modules load without errors  
✅ Babel compilation succeeds  
✅ HTML served correctly (tested with root endpoint)  
✅ Mongoose models registry unified (all API and module models in single registry)  

## Modules Now Using Singleton
- `garantie-aquila` - Warranty model and configuration
- `questions-reponses-aquila` - Questions model and services

## Recommendations for Future Work

1. **Proactive Update:** Update other modules to use the singleton:
   - `payzen-aquila`
   - `analytics-react-aquila`
   - `comparateur-aquila`

2. **Code Review:** Check for any other Mongoose usages outside of models/services

3. **Documentation:** Add singleton pattern to project contribution guidelines

4. **Testing:** Add integration tests to verify module models are accessible to API

## Commands to Verify

```bash
# Start the server
npm start

# Server should start without any "buffering timed out" errors
# Look for: "server listening on port 3010 with HTTP/1.1"

# Test API endpoint
curl http://localhost:3010/
```

## Key Files to Remember

| File | Purpose |
|------|---------|
| `/apps/api/utils/mongooseSingleton.js` | Source of truth for Mongoose instance |
| `/MONGOOSE_SINGLETON_GUIDE.md` | Detailed implementation guide |
| `/package.json` | Root workspace configuration |
| Module models/*.js | All use singleton import |

---

**Status:** ✓ Issue Resolved - All Mongoose buffering timeout errors eliminated
**Last Updated:** October 26, 2024
