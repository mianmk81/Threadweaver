# Google Gemini AI Integration Setup

## Overview

Threadweaver now supports custom decision card generation using Google's Gemini AI. When users provide their company information (name, industry, size, challenges, goals), the AI generates personalized sustainability scenarios tailored to their specific context.

## Features

 **Company Profile Wizard**: 3-step onboarding to collect company details
 **AI Card Generation**: Gemini creates 10 custom decision cards based on company profile
 **Custom Initial Metrics**: Starting metrics adjusted based on stated challenges
 **Industry-Specific Scenarios**: Decisions relevant to the user's industry and scale
 **Fallback**: If API fails, system uses default campus dining scenario

## Setup Instructions

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated key (starts with `AIzaSy...`)

### 2. Configure Backend Environment

Create a `.env` file in the `api/` directory:

```bash
cd api
```

**Windows (Command Prompt)**:
```bash
echo GEMINI_API_KEY=your_actual_api_key_here > .env
```

**Windows (PowerShell)**:
```powershell
"GEMINI_API_KEY=your_actual_api_key_here" | Out-File -FilePath .env -Encoding UTF8
```

**Mac/Linux**:
```bash
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env
```

Replace `your_actual_api_key_here` with your actual API key from step 1.

### 3. Restart Backend Server

The backend needs to be restarted to pick up the new environment variable:

```bash
# Stop current backend (Ctrl+C)
cd api
python -m uvicorn main:app --reload
```

### 4. Test the Integration

1. **Start the frontend**:
   ```bash
   npm run dev
   ```

2. **Navigate to** [http://localhost:3000](http://localhost:3000)

3. **Click "Enter the Loom"**

4. **Company Setup Modal** should appear with 3 steps:
   - **Step 1**: Enter company name, select industry, company size, location
   - **Step 2**: Select current challenges and sustainability goals (multi-select)
   - **Step 3**: Provide optional description

5. **Click "Complete Setup"** to generate custom cards

6. **Check browser console** for success message:
   ```
   Generated 10 custom cards for [Your Company Name]
   ```

## How It Works

### Frontend Flow

1. **CompanySetupModal** (`components/ui/CompanySetupModal.tsx`)
   - Collects company information in 3-step wizard
   - Validates required fields
   - Submits profile to loom page

2. **Loom Page** (`app/loom/page.tsx`)
   - Calls `generateCustomCards()` API with company profile
   - Shows loading state while AI generates cards
   - Creates new session with custom profile

3. **API Client** (`lib/utils/api.ts`)
   - Sends company profile to backend `/api/generate-custom-cards`
   - Returns custom cards and initial metrics

### Backend Flow

1. **API Endpoint** (`api/main.py`)
   - `/api/generate-custom-cards` receives company profile
   - Calls Gemini engine to generate cards

2. **Gemini Engine** (`api/engine/gemini.py`)
   - `generate_custom_cards()`: Builds detailed prompt for Gemini
   - Gemini generates JSON array of decision cards
   - `calculate_custom_initial_metrics()`: Adjusts starting metrics based on challenges

3. **Response**
   - Returns custom cards array
   - Returns customized initial metrics
   - Includes scaling context explanation

## Example Generated Card

For a **"Small Manufacturing Company"** with **"High waste generation"** challenge:

```json
{
  "id": "manufacturing-waste-audit",
  "title": "Production Waste Audit Findings",
  "prompt": "Your production floor generates 30% scrap material. How do you address this?",
  "tags": ["waste", "efficiency", "cost"],
  "severity": "medium",
  "triggers": {"waste_min": 55},
  "options": [
    {
      "id": "process-redesign",
      "label": "Redesign cutting process",
      "description": "Invest in precision equipment to reduce material waste",
      "deltas": {
        "waste": -15,
        "emissions": -5,
        "cost": 12,
        "efficiency": 10,
        "communityTrust": 5
      },
      "explanation": "Higher upfront cost but significant waste reduction"
    },
    {
      "id": "recycle-program",
      "label": "Implement scrap recycling",
      "description": "Partner with local recyclers to reclaim scrap material",
      "deltas": {
        "waste": -8,
        "emissions": -3,
        "cost": -2,
        "efficiency": 0,
        "communityTrust": 8
      },
      "explanation": "Cost-neutral solution with moderate waste impact"
    }
  ]
}
```

## Troubleshooting

### "GEMINI_API_KEY environment variable not set"

**Problem**: Backend can't find API key
**Solution**:
1. Check `.env` file exists in `api/` directory
2. Verify file contains `GEMINI_API_KEY=your_key`
3. Restart backend server (environment variables only load on startup)

### "Failed to generate custom cards"

**Problem**: Gemini API call failed
**Solution**:
1. Check API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Verify you have API quota remaining (free tier: 60 requests/min)
3. Check backend logs for detailed error message
4. System will fallback to default scenario automatically

### Cards Not Showing in Timeline

**Problem**: Custom cards generated but not appearing in decisions
**Note**: Current implementation generates cards but they're not yet persisted to the decision pool. This is a known limitation—generated cards are logged but the game still uses `data/cards.json`.

**Future Enhancement**: Store custom cards in database or session state for use during gameplay.

## API Quotas

Google Gemini API has rate limits:

- **Free tier**: 60 requests/minute, 1500 requests/day
- **Each company setup**: 1 API call
- **Recommended**: Use skip option for testing, complete setup for real scenarios

## File Structure

```
threadweaver/
 api/
    .env                         # Your API key (gitignored)
    .env.example                 # Template
    engine/
       gemini.py                # Gemini integration
    schemas/
       models.py                # CompanyProfile models
    main.py                      # /api/generate-custom-cards endpoint
 app/
    loom/
        page.tsx                 # Company setup integration
 components/
    ui/
        CompanySetupModal.tsx    # 3-step wizard
 lib/
    types.ts                     # CompanyProfile schema
    utils/
       api.ts                   # generateCustomCards()
    store/
        useThreadweaverStore.ts  # Company profile state
 GEMINI_SETUP.md                  # This file
```

## Next Steps

1.  Set up Gemini API key
2.  Test company profile wizard
3.  Verify custom card generation in console
4.  **Future**: Persist custom cards to database
5.  **Future**: Use custom cards in decision flow (currently uses default cards)
6.  **Future**: Add custom metrics units based on company profile

## Support

- **Gemini API Issues**: [Google AI Studio Support](https://support.google.com/)
- **Threadweaver Issues**: Check browser console and backend logs
- **API Documentation**: [Gemini API Docs](https://ai.google.dev/docs)
