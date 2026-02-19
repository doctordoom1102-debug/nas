import { NextRequest, NextResponse } from "next/server";

// Returns the #-delimited config string that clsMain.smethod_108() expects
// Format: true/false flags, numeric values, encrypted key, URL, etc.
// This replaces the GitHub-hosted tesladata.txt
export async function GET(req: NextRequest) {
  console.log("[DLL Config] GET request");
  
  // Config format from clsMain line 6882 (default fallback)
  // Fields (by position, # delimited):
  // 0: enabled(true) 1-4: feature flags 5: num1(111) 6: num2(120) 
  // 7-9: flags 10: num(2) 11: flag 12-14: flags
  // 15: encrypted key 16-17: flags 18: flag 19: num(2) 20: num(119)
  // 21: flag 22-23: flags 24: num(77) 25: base URL 26: flag 27: flag
  // 28: num(1) 29: flag
  const config = [
    "true",    // 0: enabled
    "false",   // 1
    "false",   // 2
    "false",   // 3
    "false",   // 4
    "111",     // 5
    "120",     // 6
    "false",   // 7
    "false",   // 8
    "false",   // 9
    "2",       // 10
    "true",    // 11
    "false",   // 12
    "false",   // 13
    "false",   // 14
    "DK9tcF7yrzMWJsi1PTAtLaT6WnNSMSxVgoIFFr51g26vER0SYHr+oEFhKtGA2NTs", // 15: encrypted key
    "false",   // 16
    "true",    // 17
    "true",    // 18
    "2",       // 19
    "119",     // 20
    "false",   // 21
    "true",    // 22
    "true",    // 23
    "77",      // 24
    "http://localhost:3000/", // 25: base URL
    "false",   // 26
    "true",    // 27
    "1",       // 28
    "false",   // 29
  ].join("#");

  // Return as plain text — the DLL reads this with StreamReader.ReadToEnd()
  return new NextResponse(config, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(req: NextRequest) {
  // Some endpoints POST to config-like URLs
  return NextResponse.json({ success: true, message: "OK" });
}
