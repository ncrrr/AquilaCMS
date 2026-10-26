/*
 * Product    : AQUILA-CMS
 * Author     : Nextsourcia - contact@aquila-cms.com
 * Copyright  : 2023 © Nextsourcia - All rights reserved.
 * License    : Open Software License (OSL 3.0) - https://opensource.org/licenses/OSL-3.0
 * Disclaimer : Shared mongoose instance to ensure all models register in the same connection
 */

/**
 * This module ensures that all parts of the application (API and modules)
 * use the same mongoose instance. This prevents duplicate model registration issues.
 */
module.exports = require('mongoose');

/**
 * this file is used by modules to register modules models on the same register than the API
 * for more details, check api/docs/mongooseSingleton markdowns files
  */