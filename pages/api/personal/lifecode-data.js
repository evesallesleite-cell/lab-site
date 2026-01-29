// API to fetch LifeCode/genetic data from Supabase
import { createOptionalClient, isSupabaseConfigured } from '../../../lib/supabase-optional';

const supabase = createOptionalClient();

export default async function handler(req, res) {
  try {
    console.log("[/api/personal/lifecode-data] start");
    
    // Return demo data if Supabase not configured
    if (!isSupabaseConfigured()) {
      return res.status(200).json({
        demo: true,
        message: 'Supabase not configured - showing demo data',
        items: [],
        categories: [],
        summary: { totalItems: 0 }
      });
    }
    
    // Fetch LifeCode results
    const { data, error } = await supabase
      .from("lifecode_items")
      .select("*")
      .order("collected_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // Group by category/type
    const categoryGroups = {};
    const geneGroups = {};

    for (const record of data || []) {
      const category = record.category?.trim() || 'General';
      const gene = record.gene?.trim();

      // Group by category
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(record);

      // Group by gene if available
      if (gene) {
        if (!geneGroups[gene]) {
          geneGroups[gene] = [];
        }
        geneGroups[gene].push(record);
      }
    }

    // Calculate summary stats
    const totalCategories = Object.keys(categoryGroups).length;
    const totalGenes = Object.keys(geneGroups).length;
    const totalResults = data?.length || 0;
    const lastCollectedDate = data?.[0]?.collected_at || null;

    // Get sample results for each category
    const categoryResults = Object.entries(categoryGroups).map(([category, records]) => ({
      category,
      count: records.length,
      sampleResults: records.slice(0, 3).map(r => ({
        gene: r.gene,
        variant: r.variant,
        genotype: r.genotype,
        risk_factor: r.risk_factor,
        description: r.description
      }))
    }));

    const summary = {
      totalCategories,
      totalGenes,
      totalResults,
      lastCollectedDate,
      categoryResults,
      allResults: data || []
    };

    console.log("[/api/personal/lifecode-data] ok, categories:", totalCategories, "genes:", totalGenes);
    res.status(200).json({ success: true, data: summary });
    
  } catch (e) {
    console.error("[/api/personal/lifecode-data] ERROR:", e);
    res.status(500).json({ success: false, error: String(e?.message || e) });
  }
}