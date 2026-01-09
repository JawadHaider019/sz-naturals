  // controllers/dealTypeController.js
  import DealType from '../models/DealtypeModel.js';

  // Helper function to generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Get all deal types
  export const getAllDealTypes = async (req, res) => {
    try {
      const dealTypes = await DealType.find().sort({ createdAt: -1 });
      res.json(dealTypes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Create new deal type
  export const createDealType = async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Deal type name is required' });
      }

      // Generate slug from name
      const slug = generateSlug(name);

      const dealType = new DealType({ 
        name, 
        description,
        slug 
      });
      
      const savedDealType = await dealType.save();
      res.status(201).json(savedDealType);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Update deal type
  export const updateDealType = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      let updateData = { description };
      
      // If name is being updated, generate new slug
      if (name) {
        updateData.name = name;
        updateData.slug = generateSlug(name);
      }

      const dealType = await DealType.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!dealType) {
        return res.status(404).json({ error: 'Deal type not found' });
      }

      res.json(dealType);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Delete deal type
  export const deleteDealType = async (req, res) => {
    try {
      const { id } = req.params;

      const dealType = await DealType.findByIdAndDelete(id);
      if (!dealType) {
        return res.status(404).json({ error: 'Deal type not found' });
      }

      res.json({ message: 'Deal type deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };