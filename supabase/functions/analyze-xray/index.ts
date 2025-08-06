import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl, imageType, analysisType = 'comprehensive' } = await req.json()

    console.log('Starting X-ray analysis for:', imageUrl, 'Type:', imageType)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch the image from Supabase storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('medical-images')
      .download(imageUrl.replace('medical-images/', ''))

    if (downloadError) {
      console.error('Error downloading image:', downloadError)
      throw new Error('Failed to download image for analysis')
    }

    // Convert blob to base64 for processing
    const arrayBuffer = await imageData.arrayBuffer()
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    // Simulate AI analysis (in real implementation, this would use actual AI models)
    const analysisResults = await performXrayAnalysis(base64Image, imageType, analysisType)

    console.log('Analysis completed:', analysisResults)

    return new Response(
      JSON.stringify(analysisResults),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in X-ray analysis:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed', 
        details: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function performXrayAnalysis(base64Image: string, imageType: string, analysisType: string) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000))

  const baseAnalysis = {
    success: true,
    analysisId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    imageType,
    analysisType,
    confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
    processingTime: 2.1,
  }

  if (imageType === 'xray') {
    return {
      ...baseAnalysis,
      findings: {
        teeth: {
          detected: generateTeethFindings(),
          total: 28 + Math.floor(Math.random() * 5)
        },
        cavities: generateCavityFindings(),
        boneLoss: generateBoneLossAnalysis(),
        rootCanals: generateRootCanalFindings(),
        anomalies: generateAnomalies()
      },
      measurements: {
        crownToRoot: generateMeasurements(),
        boneDensity: 0.7 + Math.random() * 0.3,
        cervicalBurnout: Math.random() > 0.7
      },
      recommendations: [
        'Regular dental checkup recommended',
        'Monitor tooth #14 for potential cavity development',
        'Consider fluoride treatment for cavity prevention'
      ],
      urgency: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low'
    }
  } else {
    return {
      ...baseAnalysis,
      findings: {
        general: 'Image quality analysis completed',
        contrast: 0.8 + Math.random() * 0.2,
        clarity: 0.75 + Math.random() * 0.25,
        artifacts: Math.random() > 0.7 ? ['Motion blur detected'] : []
      }
    }
  }
}

function generateTeethFindings() {
  const teeth = []
  for (let i = 1; i <= 32; i++) {
    if (Math.random() > 0.1) { // 90% chance tooth is present
      teeth.push({
        number: i,
        condition: Math.random() > 0.8 ? 'restored' : 'healthy',
        confidence: 0.8 + Math.random() * 0.2
      })
    }
  }
  return teeth
}

function generateCavityFindings() {
  const cavities = []
  const cavityCount = Math.floor(Math.random() * 3)
  
  for (let i = 0; i < cavityCount; i++) {
    cavities.push({
      tooth: Math.floor(Math.random() * 32) + 1,
      severity: ['mild', 'moderate', 'severe'][Math.floor(Math.random() * 3)],
      location: ['occlusal', 'mesial', 'distal', 'buccal', 'lingual'][Math.floor(Math.random() * 5)],
      confidence: 0.7 + Math.random() * 0.3
    })
  }
  return cavities
}

function generateBoneLossAnalysis() {
  return {
    present: Math.random() > 0.6,
    severity: ['mild', 'moderate', 'severe'][Math.floor(Math.random() * 3)],
    areas: ['anterior', 'posterior', 'generalized'][Math.floor(Math.random() * 3)],
    confidence: 0.75 + Math.random() * 0.25
  }
}

function generateRootCanalFindings() {
  const rootCanals = []
  if (Math.random() > 0.7) {
    rootCanals.push({
      tooth: Math.floor(Math.random() * 32) + 1,
      status: 'completed',
      quality: ['excellent', 'good', 'adequate'][Math.floor(Math.random() * 3)]
    })
  }
  return rootCanals
}

function generateAnomalies() {
  const anomalies = []
  if (Math.random() > 0.8) {
    const anomalyTypes = [
      'Impacted wisdom tooth',
      'Supernumerary tooth',
      'Dilaceration',
      'Calcification'
    ]
    anomalies.push({
      type: anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)],
      location: `Tooth #${Math.floor(Math.random() * 32) + 1}`,
      confidence: 0.6 + Math.random() * 0.4
    })
  }
  return anomalies
}

function generateMeasurements() {
  return {
    crownHeight: 8 + Math.random() * 4,
    rootLength: 12 + Math.random() * 6,
    pulpChamber: 2 + Math.random() * 2
  }
}