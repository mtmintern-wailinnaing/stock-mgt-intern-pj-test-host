import { NextResponse } from "next/server";
import { getWeeklyStockCheckService,upsertWeeklyStockCheckService } from "@/services/stockcheck.service.js";
import { AppError } from "@/lib/errors";
import { weeklyCheckFormSchema } from "@/lib/validations/stockcheck";

export async function GET(request){
    try{
        const {searchParams} = new URL(request.url);
        const monthIdParam = searchParams.get("monthId"); 

        const monthId = parseInt(monthIdParam, 10);
        if(!monthId || isNaN(monthId)){
            throw new AppError("Month ID is required!" ,400 );
        }

        const stockCheckData = await getWeeklyStockCheckService(monthId);
        return NextResponse.json(stockCheckData);
    }catch(error){
      // Error အပြည့်အစုံကို log ထုတ်ပေးပါ
        console.error("--- FULL ERROR LOG ---");
        console.error(error);
        return NextResponse.json(
      { error: error.message || "Internal Server Error.Failed to fetch categories." },
      { status: 500 },
    );
    }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    
    const validatedData = weeklyCheckFormSchema.parse(data); 
    validatedData.currentUserId = data.currentUserId;
    
    const response = await upsertWeeklyStockCheckService(validatedData);
    
    return NextResponse.json({ 
        success: true, 
        result: response.result,
        warning: response.warning || null 
    }, { status: 200 });

  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ errors: error.format() }, { status: 400 });
    }
     if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}