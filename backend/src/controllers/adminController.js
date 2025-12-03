const { configOps } = require('../models/database');

// Get current configuration
exports.getConfig = async (req, res) => {
  try {
    const config = await configOps.getConfig();

    // Transform to grouped format
    const groupedConfig = {
      page2: [],
      page3: []
    };

    config.forEach(item => {
      if (item.page_number === 2) {
        groupedConfig.page2.push(item.component_type);
      } else if (item.page_number === 3) {
        groupedConfig.page3.push(item.component_type);
      }
    });

    res.json({ config: groupedConfig });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update configuration
exports.updateConfig = async (req, res) => {
  try {
    const { page2, page3 } = req.body;

    // Validate that each page has at least one component
    if (!page2 || !page3 || page2.length === 0 || page3.length === 0) {
      return res.status(400).json({
        error: 'Each page must have at least one component'
      });
    }

    // Validate component types
    const validTypes = ['about_me', 'address', 'birthdate'];
    const allComponents = [...page2, ...page3];
    const invalidComponents = allComponents.filter(c => !validTypes.includes(c));

    if (invalidComponents.length > 0) {
      return res.status(400).json({
        error: `Invalid component types: ${invalidComponents.join(', ')}`
      });
    }

    // Check for duplicate components
    const componentSet = new Set(allComponents);
    if (componentSet.size !== allComponents.length) {
      return res.status(400).json({
        error: 'Components cannot appear on multiple pages'
      });
    }

    // Ensure all three components are used
    if (componentSet.size !== 3) {
      return res.status(400).json({
        error: 'All three components must be assigned to a page'
      });
    }

    // Build config array
    const configs = [];
    page2.forEach((type, index) => {
      configs.push({ page_number: 2, component_type: type, display_order: index });
    });
    page3.forEach((type, index) => {
      configs.push({ page_number: 3, component_type: type, display_order: index });
    });

    await configOps.updateConfig(configs);

    res.json({ message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
