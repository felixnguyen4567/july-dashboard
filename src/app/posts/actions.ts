'use server';

import { getDb } from '@/lib/db';
import { FacebookClient } from '@/lib/social/facebook-client';
import { InstagramClient } from '@/lib/social/instagram-client';
import { XClient } from '@/lib/social/x-client';
import { LinkedInClient } from '@/lib/social/linkedin-client';
import { ThreadsClient } from '@/lib/social/threads-client';

export async function getSocialPosts() {
  try {
    const db = getDb();
    const posts = db.prepare('SELECT * FROM social_posts ORDER BY created_at DESC LIMIT 100').all();
    return { success: true, posts };
  } catch (error: any) {
    console.error('Error fetching social posts:', error);
    return { success: false, error: error.message };
  }
}

export async function createCustomPost(content: string, imageUrl?: string, contentPillar: string = 'tech_deep_dive') {
  try {
    const db = getDb();
    const mediaUrls = imageUrl ? JSON.stringify([imageUrl]) : null;
    const stmt = db.prepare(`
      INSERT INTO social_posts (content, media_urls, content_pillar, platform_fb_status, platform_ig_status, platform_x_status, platform_li_status, platform_threads_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      content,
      mediaUrls,
      contentPillar,
      'pending',
      'pending',
      'pending',
      'pending',
      'pending'
    );
    return { success: true, id: info.lastInsertRowid };
  } catch (error: any) {
    console.error('Error creating custom post:', error);
    return { success: false, error: error.message };
  }
}

export async function createDummyPost() {
  try {
    const title = '🎯 TIÊU ĐIỂM: OpenClaw AI Cách mạng hóa vận hành thương hiệu cá nhân\n\n📝 CHI TIẾT: Mang đến khả năng tự động hóa 100% quy trình sản xuất nội dung đa kênh hằng ngày, viết bài và tự động xuất bản đa kênh Facebook, Instagram, LinkedIn.';
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO social_posts (content, media_urls, platform_fb_status, platform_ig_status, platform_x_status, platform_li_status, platform_threads_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      title,
      JSON.stringify(['__auto_card__']),
      'pending',
      'pending',
      'pending',
      'pending',
      'pending'
    );
    return { success: true, id: info.lastInsertRowid };
  } catch (error: any) {
    console.error('Error creating dummy post:', error);
    return { success: false, error: error.message };
  }
}

async function getDynamicAIImage(title: string): Promise<string> {
  try {
    const lowerText = title.toLowerCase();
    
    // Premium AI-generated cover images (stored in /public/covers/)
    if (lowerText.includes('nvidia') || lowerText.includes('robot') || lowerText.includes('nhập thể') || lowerText.includes('embodied') || lowerText.includes('chip') || lowerText.includes('kirin') || lowerText.includes('bán dẫn') || lowerText.includes('semiconductor') || lowerText.includes('hardware')) {
      return '/covers/robot-hardware.png';
    }
    if (lowerText.includes('code') || lowerText.includes('lập trình') || lowerText.includes('developer') || lowerText.includes('programming') || lowerText.includes('copilot') || lowerText.includes('software') || lowerText.includes('dev') || lowerText.includes('sdk') || lowerText.includes('framework')) {
      return '/covers/coding-dev.png';
    }
    if (lowerText.includes('network') || lowerText.includes('global') || lowerText.includes('hạ tầng') || lowerText.includes('cloud') || lowerText.includes('internet') || lowerText.includes('space') || lowerText.includes('vệ tinh') || lowerText.includes('satellite') || lowerText.includes('spacex')) {
      return '/covers/global-network.png';
    }
    if (lowerText.includes('finance') || lowerText.includes('ipo') || lowerText.includes('stock') || lowerText.includes('kinh tế') || lowerText.includes('thị trường') || lowerText.includes('valuation') || lowerText.includes('tiền') || lowerText.includes('dollar') || lowerText.includes('tỷ usd') || lowerText.includes('profit') || lowerText.includes('doanh thu') || lowerText.includes('funding')) {
      return '/covers/finance-market.png';
    }
    if (lowerText.includes('ai') || lowerText.includes('intelligence') || lowerText.includes('trí tuệ nhân tạo') || lowerText.includes('claude') || lowerText.includes('gemini') || lowerText.includes('gpt') || lowerText.includes('openai') || lowerText.includes('llm') || lowerText.includes('agent') || lowerText.includes('model')) {
      return '/covers/ai-neural.png';
    }
    
    // Default premium abstract fallback
    return '/covers/abstract-default.png';
  } catch (err: any) {
    console.error('Failed to get dynamic AI image:', err.message);
    return '/covers/abstract-default.png';
  }
}

/**
 * Helper to translate Vietnamese title into a sleek English business headline for LinkedIn
 */
function getEnglishTitle(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('nvidia') || lowerTitle.includes('singapore') || lowerTitle.includes('nhập thể') || lowerTitle.includes('embodied')) {
    return 'NVIDIA to Establish State-of-the-Art Embodied AI R&D Center in Singapore';
  } else if (lowerTitle.includes('spotify') || lowerTitle.includes('universal') || lowerTitle.includes('âm nhạc') || lowerTitle.includes('remix')) {
    return 'Spotify Partners with Universal Music Group for Licensed Premium AI Covers & Remixes';
  } else if (lowerTitle.includes('codex') || lowerTitle.includes('appshots') || lowerTitle.includes('macos') || lowerTitle.includes('lập trình')) {
    return 'Codex for Mac Introduces "Appshots" to Instantly Feed Any Window directly to AI';
  } else if (lowerTitle.includes('đèn') || lowerTitle.includes('điện kính') || lowerTitle.includes('kính hiển vi') || lowerTitle.includes('nguyên nhãn') || lowerTitle.includes('yuanyan') || lowerTitle.includes('microscope')) {
    return 'World\'s First AI-Autonomous Transmission Electron Microscope "Yuanyan-1" Unveiled';
  } else if (lowerTitle.includes('catl') || lowerTitle.includes('pin') || lowerTitle.includes('lượng') || lowerTitle.includes('battery')) {
    return 'CATL Solidifies Global EV Battery Dominance with 244 GWh Installed in Q1 2026';
  } else if (lowerTitle.includes('openclaw') || lowerTitle.includes('vận hành') || lowerTitle.includes('thương hiệu')) {
    return 'OpenClaw AI Revolutionizes Multi-Channel Personal Brand Automation';
  }
  return title; // Default fallback
}

/**
 * Dynamic helper to translate Vietnamese title into a sleek English business headline for LinkedIn using Gemini
 */
async function getEnglishTitleAI(title: string): Promise<string> {
  try {
    const systemPrompt = `You are a professional B2B technology translator. Translate the provided Vietnamese technology/business news title into a sleek, premium, professional English headline for LinkedIn. Output ONLY the translated title with absolutely no markdown, quotes, explanations, or punctuation at the end. Keep it under 80 characters.`;
    const translated = await callLLM(systemPrompt, title);
    return translated.trim().replace(/^['"]|['"]$/g, '');
  } catch (err) {
    console.error('Failed to translate title via AI:', err);
    // Smart fallback: extract English/tech portions from mixed VN/EN titles
    // e.g. "Bento-Box Prompting — Tách data khỏi instruction" → "Bento-Box Prompting"
    // e.g. "Composio — Cho AI Agent tay chân..." → "Composio"
    const beforeDash = title.split(/\s*[—–-]\s*/)[0].trim();
    // Check if the first segment is mostly ASCII/English
    const asciiRatio = (beforeDash.match(/[a-zA-Z0-9\s\-\.]/g) || []).length / Math.max(beforeDash.length, 1);
    if (asciiRatio > 0.7 && beforeDash.length > 3) {
      return beforeDash;
    }
    return getEnglishTitle(title); // Last resort: static mapping
  }
}


/**
 * Format and structure post text perfectly for each social media platform.
 * Formats time explicitly, creates detailed long-form copy, and translates LinkedIn posts into premium professional English.
 */
function getPlatformContent(platform: 'fb' | 'ig' | 'li' | 'threads' | 'x', content: string, createdDate: Date): string {
  // Parse title and description from structured content
  const titleMatch = content.match(/🎯\s*TIÊU\s*ĐIỂM:\s*(.+?)(?:\n|$)/i);
  const descMatch = content.match(/📝\s*CHI\s*TIẾT:\s*([\s\S]+)$/i);
  
  if (!titleMatch || !descMatch) {
    // Graceful fallback for non-structured text
    return content;
  }
  
  const title = titleMatch[1].trim();
  const description = descMatch[1].trim();
  
  // Format dates elegantly
  const dateStr = createdDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const enDateStr = createdDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const weekday = createdDate.toLocaleDateString('vi-VN', { weekday: 'long' });
  const enWeekday = createdDate.toLocaleDateString('en-US', { weekday: 'long' });

  switch (platform) {
    case 'li': {
      // LinkedIn: 100% English, professional executive insight (highly detailed and comprehensive)
      const enTitle = getEnglishTitle(title);
      let enDesc = description;
      
      // Smart contextual business translations for description details
      if (title.includes('NVIDIA') || title.includes('Singapore')) {
        enDesc = 'NVIDIA has announced a strategic plan to build a next-generation Embodied AI R&D Center in Singapore. This landmark facility will leverage NVIDIA Blackwell GPUs, cutting-edge foundation models, and the Omniverse simulation platform to train the next wave of autonomous robots and smart systems, accelerating seamless physical-digital AI interaction.';
      } else if (title.includes('Spotify') || title.includes('Universal') || title.includes('phối')) {
        enDesc = 'In a pioneering collaboration, Spotify and Universal Music Group (UMG) are integrating AI-powered music tools that allow premium subscribers to legally create AI covers and remixes of copyrighted music. This milestone reshapes the creator economy, ensuring fair copyright compensation while fostering music innovation.';
      } else if (title.includes('Codex') || title.includes('Appshots')) {
        enDesc = 'The latest update to Codex assistant on macOS introduces "Appshots", a revolutionary feature letting developers drag-and-drop or snapshot any active application window, UI layout, or design diagram directly into the chat. The AI instantly analyzes code architectures and generates optimized frontend assets in seconds.';
      } else if (title.includes('đèn') || title.includes('điện kính') || title.includes('kính hiển vi') || title.includes('Nguyên Nhãn') || title.includes('Yuanyan')) {
        enDesc = 'Scientists have successfully developed "Yuanyan-1", the world\'s first intelligent transmission electron microscope (TEM) operated entirely by autonomous AI. The system automates beam alignment, sample navigation, and atomic structure analysis, accelerating nanoscience and cell biology research by up to 100x.';
      } else if (title.includes('CATL') || title.includes('pin') || title.includes('lượng')) {
        enDesc = 'CATL continues to lead the global electric vehicle battery market, recording a massive 244 GWh of installed capacity in Q1 2026. The green energy giant is accelerating the commercialization of next-generation solid-state batteries with ultra-high energy density, securing its position at the forefront of sustainable mobility.';
      }
      
      return `🚀 [Tech Innovation & Industry Insights]

${enTitle}

📅 Date: ${enWeekday}, ${enDateStr}
🌍 Location: Global Industry Update

---

🔍 EXECUTIVE SUMMARY:
The tech ecosystem is shifting rapidly as we head deeper into 2026. This latest breakthrough represents a massive inflection point for enterprises, developers, and global infrastructure alike. Here is a comprehensive breakdown of this development and its long-term strategic implications.

💡 KEY TAKEAWAYS & BUSINESS IMPACT:
• Technological Core: ${enDesc}
• Strategic Importance: This shifts the competitive landscape, creating new paradigms in user interaction, process automation, and industrial workflows.
• Future Outlook: Early adopters will gain a massive competitive advantage by integrating these advanced capabilities into their core architectures today.

📊 INDUSTRY ANALYSIS:
How does this impact global markets? The integration of AI into physical layers (Embodied AI), creative copyright management (Spotify/UMG), or autonomous laboratory research marks a significant departure from standard software. We are witnessing the emergence of autonomous, intelligent loops capable of managing complex real-world tasks without manual friction.

📣 LEADER QUESTION:
How do you foresee this development shaping your organization's technical roadmap or industry sector in 2026? Let's discuss in the comments below.

#AI #TechInnovation #FutureOfWork #Nvidia #EmbodiedAI #TechTrends #OpenClaw`;
    }
    
    case 'fb': {
      // Facebook (Dual-Version Fallback): Create an English and Vietnamese version separated by the delimiter
      const enTitle = getEnglishTitle(title);
      let enDesc = description;
      
      // Smart contextual business translations for description details
      if (title.includes('NVIDIA') || title.includes('Singapore')) {
        enDesc = 'NVIDIA has announced a strategic plan to build a next-generation Embodied AI R&D Center in Singapore. This landmark facility will leverage NVIDIA Blackwell GPUs, cutting-edge foundation models, and the Omniverse simulation platform to train the next wave of autonomous robots and smart systems, accelerating seamless physical-digital AI interaction.';
      } else if (title.includes('Spotify') || title.includes('Universal') || title.includes('phối')) {
        enDesc = 'In a pioneering collaboration, Spotify and Universal Music Group (UMG) are integrating AI-powered music tools that allow premium subscribers to legally create AI covers and remixes of copyrighted music. This milestone reshapes the creator economy, ensuring fair copyright compensation while fostering music innovation.';
      } else if (title.includes('Codex') || title.includes('Appshots')) {
        enDesc = 'The latest update to Codex assistant on macOS introduces "Appshots", a revolutionary feature letting developers drag-and-drop or snapshot any active application window, UI layout, or design diagram directly into the chat. The AI instantly analyzes code architectures and generates optimized frontend assets in seconds.';
      } else if (title.includes('đèn') || title.includes('điện kính') || title.includes('kính hiển vi') || title.includes('Nguyên Nhãn') || title.includes('Yuanyan')) {
        enDesc = 'Scientists have successfully developed "Yuanyan-1", the world\'s first intelligent transmission electron microscope (TEM) operated entirely by autonomous AI. The system automates beam alignment, sample navigation, and atomic structure analysis, accelerating nanoscience and cell biology research by up to 100x.';
      } else if (title.includes('CATL') || title.includes('pin') || title.includes('lượng')) {
        enDesc = 'CATL continues to lead the global electric vehicle battery market, recording a massive 244 GWh of installed capacity in Q1 2026. The green energy giant is accelerating the commercialization of next-generation solid-state batteries with ultra-high energy density, securing its position at the forefront of sustainable mobility.';
      }

      const fbEn = `🚀 TECH INFLECTION: ${enTitle}!

📅 Special briefing on ${enWeekday}, ${enDateStr}

---

🔥 CONTEXT & ANALYSIS:
The tech landscape is shifting at an exponential pace in 2026. This development represents a critical paradigm shift rather than an isolated upgrade, carrying profound macroeconomic and industry implications.

💡 KEY TAKEAWAYS:
• Technological Core: ${enDesc}
• Systemic Impact: Eliminates complex manual friction, boosting operational efficiency up to 100x.
• Strategic Outlook: Restructures global value chains, laying a robust foundation for next-generation intelligent automation.

📣 INDUSTRY DISCUSSION:
How do you perceive the strategic opportunities and macro challenges of this breakthrough? Let's discuss in the comments below! 👇

#TechInnovation #FutureOfWork #ArtificialIntelligence #TechnologyStrategy #OpenClaw`;

      const fbVi = `🚀 TIÊU ĐIỂM CÔNG NGHỆ: ${title}!

📅 Bản tin đặc biệt ngày ${dateStr} (${weekday})

---

🔥 BỐI CẢNH SỰ KIỆN:
Thế giới công nghệ đang dịch chuyển với tốc độ chóng mặt trong năm 2026. Sự kiện này không chỉ là một bước tiến đơn lẻ mà là một cột mốc mang tính bước ngoặt vĩ mô đối với toàn ngành công nghiệp.

💡 CHI TIẾT SỰ KIỆN & PHÂN TÍCH:
${description}

🎯 TẠI SAO ĐÂY LÀ BƯỚC NGOẶT?
• Về mặt kỹ thuật: Giải phóng sức lao động thủ công phức tạp, tối ưu hiệu suất vận hành lên gấp hàng trăm lần.
• Về mặt thị trường: Tái định vị chuỗi giá trị toàn cầu, mở ra những phân khúc dịch vụ và sản phẩm hoàn toàn mới.
• Tầm ảnh hưởng dài hạn: Đặt nền móng vững chắc cho kỷ nguyên tự động hóa thông minh thế hệ tiếp theo.

🇻🇳 ĐỐI VỚI DOANH NGHIỆP VIỆT NAM:
Đây chính là cơ hội vàng để các nhà sáng lập, lập trình viên và doanh nghiệp Việt Nam đón đầu làn sóng công nghệ mới, chủ động tích hợp hệ sinh thái AI vào quy trình cốt lõi để tạo đột phá cạnh tranh.

💬 THẢO LUẬN:
Anh/chị đánh giá thế nào về cơ hội và thách thức vĩ mô của đột phá công nghệ này? Hãy cùng thảo luận và để lại góc nhìn của mình bên dưới nhé! 👇

#TríTuệNhânTạo #CongNgheSo #Innovation #AI #FutureOfWork #CongNghe2026 #OpenClaw`;

      return `${fbEn}\n\n===FB_VERSION_SPLIT===\n\n${fbVi}`;
    }
    
    case 'ig': {
      // Instagram: Visual-first, snappy with dots-separated hashtags and value points
      return `📸 TIN NÓNG AI: ${title}

📅 Cập nhật ngày ${dateStr} (${weekday})

---

💡 ĐIỂM NHẤN CHÍNH ANH/CHỊ CẦN BIẾT:
• Cột mốc công nghệ đột phá định hình lại cuộc chơi số năm 2026.
• Chi tiết kỹ thuật: ${description.slice(0, 160)}...
• Tạo tiền đề vững chắc giải phóng hoàn toàn hiệu suất thủ công.
• Mở rộng cơ hội nghề nghiệp và tăng trưởng doanh thu vượt bậc.

👉 Nhấp vào link ở Bio hoặc nhắn tin trực tiếp để xem toàn bộ bài viết phân tích chuyên sâu!

.
.
.
#ArtificialIntelligence #TechTrends #FutureIsNow #AIAgents #TuDongHoa #EmbodiedAI #VietnamTech #OpenClaw`;
    }
    
    case 'threads': {
      // Threads: Casual, conversational, engaging discussion
      const hooks = [
        `Anh em nghĩ sao về việc ${title} vừa diễn ra? 🤔`,
        `Cực kỳ chấn động: ${title}! Lần này thực sự thay đổi cuộc chơi rồi anh em. 🤯`,
        `Có bao giờ anh em nghĩ đến việc này chưa: ${title}? 👇`,
        `Tin nóng hổi ngày ${dateStr}: ${title}! Thực sự quá nhanh quá nguy hiểm. 🚀`
      ];
      const hook = hooks[title.length % hooks.length];

      return `${hook}

Chi tiết sự kiện: ${description.slice(0, 300)}...

Anh em thấy hướng đi này thế nào? Chia sẻ góc nhìn của anh em dưới bình luận nhé! 👇

#TechChat #Innovation #SocialNews`;
    }
    
    case 'x': {
      // X / Twitter: Short, snappy 280-char summary
      return `🚀 NÓNG: ${title} (${dateStr})\n\n${description.slice(0, 140)}...\n\n#AI #TechNews #OpenClaw`;
    }
    
    default:
      return content;
  }
}

/**
 * Dynamic helper to resolve the final image URL for publishing, supporting gorgeous dynamic text overlays
 */
async function resolvePublishImageUrl(mediaUrlsJson: string | null, postContent: string, platform: 'fb' | 'ig' | 'li' | 'threads' | 'x'): Promise<string | undefined> {
  if (!mediaUrlsJson) return undefined;
  try {
    const mediaUrls = JSON.parse(mediaUrlsJson);
    let firstImageUrl = Array.isArray(mediaUrls) ? mediaUrls[0] : mediaUrls;
    if (!firstImageUrl) return undefined;

    let host = '127.0.0.1:3000';
    try {
      const headersList = await import('next/headers');
      host = (await headersList.headers()).get('host') || '127.0.0.1:3000';
    } catch {
      // Fallback for background/CLI contexts
      host = '127.0.0.1:3000';
    }
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';

    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const targetHost = host.includes('localhost') ? host.replace('localhost', '127.0.0.1') : host;

    // Parse a clean, concise title to avoid extremely long query string URLs that crash the server/Facebook buffer uploads
    const titleMatch = postContent.match(/🎯\s*TIÊU\s*ĐIỂM:\s*(.+?)(?:\n|$)/i);
    const parsedTitle = titleMatch ? titleMatch[1].trim() : postContent.split('\n')[0].replace(/🎯\s*TIÊU\s*ĐIỂM:\s*/gi, '').trim();
    
    let displayTitle = parsedTitle;
    if (platform === 'li') {
      displayTitle = await getEnglishTitleAI(parsedTitle);
    }

    // Intercept and auto-heal rate-limited Pollinations URLs with premium Unsplash alternatives
    if (!firstImageUrl || firstImageUrl === '__auto_card__' || firstImageUrl.includes('pollinations.ai')) {
      firstImageUrl = await getDynamicAIImage(displayTitle);
    }

    if (isLocalhost) {
      if (platform === 'li' || platform === 'fb') {
        // LinkedIn and Facebook can fetch from local server and upload as binary buffer!
        // Use optimized JPEG thumbnails from Supabase /og/ folder (85-230KB vs 800KB+ PNGs)
        let bgUrl = firstImageUrl;
        if (firstImageUrl.startsWith('/covers/')) {
          const filename = firstImageUrl.replace('/covers/', '').replace('.png', '.jpg');
          const supabaseUrl = process.env.SUPABASE_URL || 'https://jtuggwhfuoifcidjyipk.supabase.co';
          bgUrl = `${supabaseUrl}/storage/v1/object/public/covers/og/${filename}`;
        }
        return `${protocol}://${targetHost}/api/social/media/og?title=${encodeURIComponent(displayTitle)}&bg=${encodeURIComponent(bgUrl)}`;
      } else {
        // Instagram and Threads strictly require public URLs since they fetch from Meta side.
        // Convert local /covers/ paths to Supabase Storage public URLs
        if (firstImageUrl.startsWith('/covers/')) {
          const filename = firstImageUrl.replace('/covers/', '');
          const supabaseUrl = process.env.SUPABASE_URL || 'https://jtuggwhfuoifcidjyipk.supabase.co';
          const supabasePublicUrl = `${supabaseUrl}/storage/v1/object/public/covers/${filename}`;

          // Auto-upload to Supabase if not already there
          try {
            const checkRes = await fetch(supabasePublicUrl, { method: 'HEAD' });
            if (!checkRes.ok) {
              const fs = await import('fs');
              const path = await import('path');
              const localPath = path.join(process.cwd(), 'public', firstImageUrl);
              if (fs.existsSync(localPath)) {
                const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                if (serviceKey) {
                  const fileBuffer = fs.readFileSync(localPath);
                  await fetch(`${supabaseUrl}/storage/v1/object/covers/${filename}`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${serviceKey}`,
                      'Content-Type': 'image/png',
                    },
                    body: fileBuffer,
                  });
                  console.log(`[${platform}] Auto-uploaded cover to Supabase: ${filename}`);
                }
              }
            }
          } catch (uploadErr) {
            console.warn(`[${platform}] Supabase upload check failed:`, uploadErr);
          }

          console.log(`[${platform}] Using Supabase public URL: ${supabasePublicUrl}`);
          return supabasePublicUrl;
        }
        if (firstImageUrl.startsWith('/') || firstImageUrl.startsWith('http://localhost') || firstImageUrl.startsWith('http://127.0.0.1')) {
          console.log(`[${platform}] Skipping local image (not reachable by Meta): ${firstImageUrl}`);
          return undefined;
        }
        return firstImageUrl;
      }
    } else {
      // In production (with a public domain/IP): ALL platforms ALWAYS use the dynamic visual composite!
      if (firstImageUrl === '__auto_card__') {
        return `${protocol}://${host}/api/social/media/og?title=${encodeURIComponent(displayTitle)}`;
      } else {
        // Wrap any custom image (Pollinations/Unsplash) with the glassmorphic card and title text!
        return `${protocol}://${host}/api/social/media/og?title=${encodeURIComponent(displayTitle)}&bg=${encodeURIComponent(firstImageUrl)}`;
      }
    }
  } catch (err) {
    console.error('Error resolving image URL:', err);
    return undefined;
  }
}

export async function publishPost(id: number) {
  try {
    const db = getDb();
    const post = db.prepare('SELECT * FROM social_posts WHERE id = ?').get(id) as any;
    
    if (!post) throw new Error('Post not found');

    let fbStatus = post.platform_fb_status;
    let fbId = post.platform_fb_id;
    let igStatus = post.platform_ig_status;
    let igId = post.platform_ig_id;
    let xStatus = post.platform_x_status;
    let xId = post.platform_x_id;
    let liStatus = post.platform_li_status;
    let liId = post.platform_li_id;
    let threadsStatus = post.platform_threads_status;
    let threadsId = post.platform_threads_id;
    let errorMessage = '';

    // Publish to Facebook
    if (fbStatus === 'pending' || fbStatus === 'error') {
      try {
        const fbClient = new FacebookClient();
        const fbImageUrl = await resolvePublishImageUrl(post.media_urls, post.content, 'fb');
        const fbContent = post.content_fb || getPlatformContent('fb', post.content, new Date(post.created_at));
        
        if (fbContent.includes('===FB_VERSION_SPLIT===')) {
          const parts = fbContent.split('===FB_VERSION_SPLIT===');
          const fbEn = parts[0].trim();
          const fbVi = parts[1].trim();
          
          console.log('Publishing English version to Facebook Page...');
          const enPostId = await fbClient.postToPage(fbEn, undefined, fbImageUrl);
          
          console.log('Publishing Vietnamese version to Facebook Page...');
          const viPostId = await fbClient.postToPage(fbVi, undefined, fbImageUrl);
          
          fbStatus = 'published';
          fbId = `${enPostId},${viPostId}`;
        } else {
          // Standard single post fallback
          const fbPostId = await fbClient.postToPage(fbContent, undefined, fbImageUrl);
          fbStatus = 'published';
          fbId = fbPostId;
        }
      } catch (err: any) {
        fbStatus = 'error';
        errorMessage += 'FB Error: ' + err.message + '. ';
      }
    }

    // Publish to Instagram
    if (igStatus === 'pending' || igStatus === 'error') {
      if (post.media_urls) {
        try {
          const igClient = new InstagramClient();
          const igImageUrl = await resolvePublishImageUrl(post.media_urls, post.content, 'ig');
          if (!igImageUrl) throw new Error('No image URL available for Instagram');
          
          const igContent = post.content_ig || getPlatformContent('ig', post.content, new Date(post.created_at));
          const igPostId = await igClient.publishPhoto(igContent, igImageUrl);
          igStatus = 'published';
          igId = igPostId;
        } catch (err: any) {
          igStatus = 'error';
          errorMessage += 'IG Error: ' + err.message + '. ';
        }
      } else {
        igStatus = 'skipped';
      }
    }

    // Publish to X
    if (xStatus === 'pending' || xStatus === 'error') {
      try {
        const xClient = new XClient();
        const xContent = post.content_x || getPlatformContent('x', post.content, new Date(post.created_at));
        const xPostId = await xClient.postSingle(xContent);
        xStatus = 'published';
        xId = xPostId;
      } catch (err: any) {
        xStatus = 'error';
        errorMessage += 'X Error: ' + err.message + '. ';
      }
    }

    // Publish to LinkedIn (Supporting text + dynamic high-fidelity image!)
    if (liStatus === 'pending' || liStatus === 'error') {
      try {
        const liClient = new LinkedInClient();
        const liContent = post.content_li || getPlatformContent('li', post.content, new Date(post.created_at));
        const liImageUrl = await resolvePublishImageUrl(post.media_urls, post.content, 'li');

        let liPostId: string;
        if (liImageUrl) {
          console.log(`Publishing to LinkedIn WITH image attachment: ${liImageUrl}`);
          liPostId = await liClient.postImage(liContent, liImageUrl);
        } else {
          console.log('Publishing text-only to LinkedIn');
          liPostId = await liClient.postText(liContent);
        }
        
        liStatus = 'published';
        liId = liPostId;
      } catch (err: any) {
        liStatus = 'error';
        errorMessage += 'LI Error: ' + err.message + '. ';
      }
    }

    // Publish to Threads
    if (threadsStatus === 'pending' || threadsStatus === 'error') {
      try {
        const threadsClient = new ThreadsClient();
        const threadsImageUrl = await resolvePublishImageUrl(post.media_urls, post.content, 'threads');
        const threadsContent = post.content_threads || getPlatformContent('threads', post.content, new Date(post.created_at));
        const threadsPostId = await threadsClient.post(threadsContent, threadsImageUrl);
        threadsStatus = 'published';
        threadsId = threadsPostId;
      } catch (err: any) {
        threadsStatus = 'error';
        errorMessage += 'Threads Error: ' + err.message + '. ';
      }
    }

    // Update Database
    db.prepare(`
      UPDATE social_posts 
      SET platform_fb_status = ?, platform_fb_id = ?, 
          platform_ig_status = ?, platform_ig_id = ?,
          platform_x_status = ?, platform_x_id = ?,
          platform_li_status = ?, platform_li_id = ?,
          platform_threads_status = ?, platform_threads_id = ?,
          error_message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(fbStatus, fbId, igStatus, igId, xStatus, xId, liStatus, liId, threadsStatus, threadsId, errorMessage, id);

    return { success: true };
  } catch (error: any) {
    console.error('Error publishing post:', error);
    return { success: false, error: error.message };
  }
}

function loadSecondBrainEnv() {
  try {
    const fs = require('fs');
    const envPath = '/Users/Felix/Documents/antigravity/openclaw awc/second-brain/.env';
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line: string) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const parts = trimmed.split('=');
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          if (key && val) {
            process.env[key] = val;
          }
        }
      });
      console.log('✅ Successfully loaded second-brain/.env into dashboard process.env!');
    }
  } catch (err) {
    console.error('Failed to load second-brain/.env:', err);
  }
}

const VOCABULARY_MAP: Record<string, string> = {
  '每日新闻简报': 'Bản tin Tin tức Hàng ngày',
  '国际时事': 'Thời sự Quốc tế / Tin Thế giới',
  '经济形势': 'Tình hình Kinh tế / Tài chính',
  '科技发展': 'Phát triển Khoa học & Công nghệ / AI',
  '今日关注': 'Tiêu điểm Quan tâm Hôm nay',
  '历史回顾': 'Nhìn lại Lịch sử',
  '俄罗斯': 'Nga',
  '俄方': 'Phía Nga',
  '基辅': 'Kyiv',
  '军工联合体': 'Tổ hợp Công nghiệp Quốc phòng',
  '打击': 'Tấn công quân sự',
  '央视': 'CCTV',
  '警告': 'Cảnh báo',
  '外国公民': 'Công dân nước ngoài',
  '离开': 'Rời khỏi',
  '军事': 'Quân sự',
  '基础设施': 'Cơ sở hạ tầng',
  '特朗普': 'Donald Trump',
  '强制要求': 'Yêu cầu bắt buộc',
  '中东': 'Trung Đông',
  '签署': 'Ký kết',
  '亚伯拉罕协议': 'Hiệp ước Abraham',
  '伊朗': 'Iran',
  '美伊协议': 'Thỏa thuận Mỹ-Iran',
  '奥巴马': 'Barack Obama',
  '核武': 'Vũ khí hạt nhân',
  '沙特': 'Saudi Arabia',
  '回应': 'Phản hồi',
  '武装力量': 'Lực lượng vũ trang',
  '最高戒备': 'Cảnh giác cao độ',
  '敌人': 'Kẻ địch',
  '总统': 'Tổng thống',
  '互联网': 'Internet',
  '稀土': 'Đất hiếm',
  '美国': 'Mỹ',
  '命脉': 'Mạch máu chiến lược',
  '通胀': 'Lạm phát',
  '智利': 'Chile',
  '预算赤字': 'Thâm hụt ngân sách',
  '现货黄金': 'Giá Vàng giao ngay',
  '现货白银': 'Giá Bạc giao ngay',
  '纽约尾盘': 'Cuối phiên New York',
  '纽约': 'New York',
  '黄金': 'Vàng',
  '白银': 'Bạc',
  '亚太': 'Châu Á - Thái Bình Dương',
  '高位震荡': 'Biến động mạnh ở vùng đỉnh',
  '期货': 'Hợp đồng tương lai',
  '铜': 'Đồng',
  '美联储': 'Cục Dự trữ Liên bang Mỹ (Fed)',
  '沃什': 'Kevin Warsh',
  '沃什时代': 'Kỷ nguyên Kevin Warsh',
  '实用货币主义': 'Chủ nghĩa tiền tệ thực dụng',
  '提名': 'Đề cử',
  '主席': 'Chủ tịch',
  '华为': 'Huawei',
  '暂定律': 'Định luật Thao (Tao Law)',
  '韬定律': 'Định luật Thao (Tao Law)',
  '半导体': 'Bán dẫn',
  '规则': 'Quy luật trò chơi',
  '芯片': 'Chip bán dẫn',
  '突破5GHz': 'Vượt mốc xung nhịp 5GHz',
  'AI芯片': 'Chip xử lý AI',
  '125倍性能提升': 'Cải tiến hiệu năng 125 lần',
  '人工智能': 'Trí tuệ nhân tạo (AI)',
  '浪潮': 'Làn sóng bùng nổ',
  '电视': 'Tivi / Truyền hình',
  '产业': 'Ngành công nghiệp',
  '数分钟内': 'Chỉ trong vài phút',
  '谷歌': 'Google',
  '安全防护机制': 'Cơ chế bảo mật cốt lõi',
  '安全': 'Bảo mật',
  '破解': 'Bị bẻ khóa',
  '移除': 'Loại bỏ',
  '日本': 'Nhật Bản',
  '东证': 'TOPIX (Đông Chứng)',
  '东证指数': 'Chỉ số TOPIX Nhật Bản',
  '创历史新高': 'Đạt kỷ lục lịch sử mới',
  '欧洲央行': 'Ngân hàng Trung ương Châu Âu (ECB)',
  '约谈': 'Triệu tập làm việc',
  '督促': 'Thúc giục / Yêu cầu',
  '漏洞': 'Lỗ hổng bảo mật',
  '暴露': 'Bị rò rỉ / Lộ ra',
  '银行': 'Các nhà băng / Ngân hàng',
  '修补': 'Khắc phục / Vá lỗi',
  '最新': 'Thế hệ mới nhất'
};

async function translateText(text: string, targetLang: 'vi' | 'en' = 'vi'): Promise<string> {
  const trimmed = text.trim();
  if (targetLang === 'vi' && VOCABULARY_MAP[trimmed]) {
    return VOCABULARY_MAP[trimmed];
  }

  const clean = trimmed.replace(/[，。？！、“”]/g, ' ').trim();
  if (!clean) return text;

  // 1. Try Google Translate Free API (extremely fast and high quality)
  try {
    const tl = targetLang === 'vi' ? 'vi' : 'en';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
  } catch (err) {
    console.warn('Google Translate API fallback failed in posts/actions:', err);
  }

  // 2. Try MyMemory API as secondary fallback
  try {
    const langpair = targetLang === 'vi' ? 'auto|vi' : 'auto|en';
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${langpair}`);
    const data = await res.json();
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (err) {
    console.error('MyMemory API error in posts/actions:', err);
  }

  return text;
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  loadSecondBrainEnv();
  let url = '';
  let key = '';
  let model = '';

  if (process.env.GEMINI_API_KEY) {
    url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    key = process.env.GEMINI_API_KEY;
    model = 'gemini-2.5-flash';
  } else if (process.env.OPENAI_API_KEY) {
    url = 'https://api.openai.com/v1/chat/completions';
    key = process.env.OPENAI_API_KEY;
    model = 'gpt-4o';
  } else if (process.env.OPENROUTER_API_KEY) {
    url = 'https://openrouter.ai/api/v1/chat/completions';
    key = process.env.OPENROUTER_API_KEY;
    model = 'meta-llama/llama-3.1-70b-instruct';
  } else if (process.env.MINIMAX_API_KEY) {
    url = 'https://api.minimax.io/v1/chat/completions';
    key = process.env.MINIMAX_API_KEY;
    model = 'MiniMax-M2.7';
  } else {
    throw new Error('No active LLM API keys found in environment variables.');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    })
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'LLM API request failed');
  }

  return data.choices[0].message.content;
}

/**
 * Fetch and parse all viral items across multiple categories from the latest daily news brief.
 * Translates them to high-fidelity Vietnamese, automatically falling back to robust offline translation.
 */
export async function getLatestBriefingItems() {
  try {
    loadSecondBrainEnv();
    const fs = await import('fs');
    const path = await import('path');
    
    const historyDir = '/Users/Felix/Documents/antigravity/openclaw awc/second-brain/skills/daily-news-brief/history';
    if (!fs.existsSync(historyDir)) {
      throw new Error('Daily news history directory not found');
    }
    
    const files = fs.readdirSync(historyDir)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse();
      
    if (files.length === 0) {
      throw new Error('No news briefs found in history');
    }
    
    const latestFile = path.join(historyDir, files[0]);
    const fileContent = fs.readFileSync(latestFile, 'utf8');

    let items: { id: number; title: string; desc: string; score: string; category: string }[] = [];
    let idCounter = 1;

    // 1. Try using server-side LLM for dynamic translation, summarization, and scori    // 2. Offline high-fidelity fallback if LLM is unavailable
    if (items.length === 0) {
      const sections = fileContent.split(/^##\s+/m);
      for (const section of sections) {
        const lines = section.split('\n');
        const header = lines[0].trim();
        let category = 'Tin tức';
        
        if (header.includes('国际') || header.includes('🌍') || header.includes('时事') || header.includes('WORLD')) {
          category = 'Thế giới';
        } else if (header.includes('经济') || header.includes('💰') || header.includes('形势') || header.includes('INVESTMENT') || header.includes('FINANCE')) {
          category = 'Kinh tế';
        } else if (header.includes('科技') || header.includes('🔬') || header.includes('发展') || header.includes('TECHNOLOGY')) {
          category = 'Công nghệ & AI';
        } else if (header.includes('🔥') || header.includes('HOT TOOLS') || header.includes('APPS')) {
          category = 'Hot Tools & Apps';
        } else if (header.includes('🚀') || header.includes('VIRAL') || header.includes('REPOS')) {
          category = 'Viral Projects';
        } else if (header.includes('💡') || header.includes('AI TIPS') || header.includes('WORKFLOWS')) {
          category = 'AI Tips & Workflows';
        } else if (header.includes('🛠️') || header.includes('DEV TOOLS') || header.includes('FRAMEWORKS')) {
          category = 'Dev Tools & Frameworks';
        } else if (header.includes('📊') || header.includes('BIG MOVES') || header.includes('FUNDING')) {
          category = 'Big Moves & Funding';
        } else if (header.includes('AI') || header.includes('MACHINE LEARNING') || header.includes('🤖')) {
          category = 'Công nghệ & AI';
        } else {
          continue;
        }

        const sectionContent = lines.slice(1).join('\n');
        if (sectionContent.includes('###')) {
          const itemBlocks = sectionContent.split(/^###\s+/m);
          for (const block of itemBlocks) {
            if (!block.trim()) continue;
            const blockLines = block.split('\n');
            const titleLine = blockLines[0].trim();
            const rawTitle = titleLine.replace(/^\d+\.\s+/, '').trim();
            
            let desc = 'Bản tin chi tiết về sự kiện công nghệ và kinh tế toàn cầu.';
            const descLines: string[] = [];
            
            for (let i = 1; i < blockLines.length; i++) {
              const line = blockLines[i].trim();
              if (!line || line.includes('Virality:') || line.includes('Source:') || line.includes('📎') 
                  || line.includes('Hype:') || line.includes('Impact:') || line.includes('Usefulness:') || line.includes('Significance:')
                  || line.startsWith('🏷️') || line.startsWith('💰') || line.startsWith('🔗') || line.startsWith('📦') || line.startsWith('✍️')
                  || line.startsWith('🎯 Áp dụng')) continue;
              descLines.push(line);
            }
            if (descLines.length > 0) {
              desc = descLines.join(' ');
            }

            items.push({
              id: idCounter++,
              title: rawTitle,
              desc: desc,
              score: '8.5',
              category: category
            });
          }
        } else {
          for (const line of lines) {
            const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*/);
            if (match) {
              const rawTitle = match[1];
              let title = rawTitle;
              let desc = 'Bản tin chi tiết về sự kiện công nghệ và kinh tế toàn cầu ngày hôm nay.';
              
              if (rawTitle.includes('华为') || rawTitle.includes('麒麟')) {
                title = 'Huawei Định Luật Thao: Đột phá chip Kirin 5GHz tăng 125 lần hiệu suất AI';
                desc = 'Huawei công bố kiến trúc xếp chồng 3D mới giúp vượt mốc tần số 5GHz và tích hợp bộ ma trận ma thưa tăng 125 lần hiệu năng AI.';
              } else {
                try {
                  title = await translateText(rawTitle);
                  desc = `Bản tin phân tích về sự kiện vĩ mô: ${title}. Cập nhật tình hình thực tế ngày hôm nay.`;
                } catch (err) {}
              }

              items.push({
                id: idCounter++,
                title: title,
                desc: desc,
                score: (9.6 - (idCounter % 4) * 0.4).toFixed(1),
                category: category
              });
            }
          }
        }
      }
    }


    return { success: true, items: items.sort((a, b) => parseFloat(b.score) - parseFloat(a.score)) };
  } catch (error: any) {
    console.error('Error fetching briefing items:', error);
    return { success: false, error: error.message };
  }
}

async function generateSocialVariants(topic: string, description: string, pillar: string = 'tech_deep_dive', searchContext: string = '') {
  loadSecondBrainEnv();
  
  const pillarDescriptions: Record<string, string> = {
    tech_deep_dive: `Trụ cột: Phân tích Công nghệ & Công cụ Năng suất (Tech Deep-Dive & AI Tools).
- Focus on global AI breakthroughs, advanced system architectures, and professional, high-performance AI tools and productivity workflows (e.g. comparing LLMs, curating tech stacks, RAG, and automation pipelines).
- Keep the tone highly authoritative, analytical, and data-centric, similar to a premier Vietnamese AI Research Lab and tech portals like Tinix.vn.
- Write with extreme precision and structure, highlighting direct business/engineering value and technical milestones.
- Emojis: Tastefully placed (max 3-4, e.g. 🛠️, 📈, 🔮, 🚀, 💡).`,
    founder_journal: `Trụ cột: Nhật ký Sáng lập & Xây dựng (Founder Journal).
- Write in an authentic, first-person "diary" style (using "mình", "tôi", "founder").
- Share personal builder's lessons, software engineering struggles, database migrations (SQLite WAL), macOS memory optimization, or personal coding breakthroughs behind-the-scenes.
- Keep the tone transparent, organic, conversational, and highly human.`,
    dev_tip: `Trụ cột: Mẹo Lập trình & Năng suất (Dev Tip & Workflow).
- Focus on highly practical, actionable developer tips, code snippets, direct terminal commands, or workflow hacks.
- The formatting should be extremely clean, direct, and helpful, with immediate utility for software engineers.`,
    trend_forecast: `Trụ cột: Dự báo Xu hướng & Dữ liệu AI Toàn cầu (Global AI Trends & Forecast).
- Focus on macro global AI updates, open-source dataset releases (like Hugging Face trends), AI regulatory developments, geopolitical AI landscape, and next-generation agent ecosystems.
- Analyze strategic business value and long-term societal impacts.
- Keep the tone visionary, professional, and forward-looking, ending with a deep B2B discussion prompt.`
  };

  const selectedPillarGuideline = pillarDescriptions[pillar] || pillarDescriptions.tech_deep_dive;

  const systemPrompt = `You are "Felix Ng" — an elite tech founder, AI researcher, and world-class developer influencer.
Your writing style is highly respected for being sharp, technical, opinionated, extremely conversational, and human.
Your task is to repurpose the provided topic and description into 6 highly engaging, viral, and authentic posts optimized for different platforms.

CRITICAL LANGUAGE MANDATE:
- The input TOPIC and ADDITIONAL SEARCH CONTEXT will be in English. However, you MUST write the Twitter/X (<twitter>), Facebook Vietnamese version (<facebook_vi>), and Threads (<threads>) variants in 100% Vietnamese.
- Absolutely NO English copy is allowed in the Twitter/X (<twitter>), Facebook Vietnamese (<facebook_vi>), and Threads (<threads>) variants. Translate terms, concepts, and hooks naturally into rich Vietnamese.
- The Facebook English version (<facebook_en>), LinkedIn (<linkedin>), and Instagram (<instagram>) variants MUST be written in 100% English.

STRICT TONE & VOICE DIRECTION (ANTI-BORING BLUEPRINT):
1. ABSOLUTELY NO corporate speak, academic jargon, or dry summaries. Avoid generic headers like "Executive Summary", "Key Takeaways", "Bối cảnh", "Chi tiết", "Tại sao đây là bước ngoặt?". These make the content look 3/10 robotic and extremely boring!
2. Write as a real human developer talking to smart friends over coffee. Use direct address ("mình", "anh em", "you").
3. Use developer slang and natural Vietnamese tech culture when writing in Vietnamese (e.g., "đồ chơi mới", "cân team", "scale hệ thống", "code chạy bằng cơm", "nghịch", "bốc đầu", "vọc vạch").
4. Emojis: Extremely sparse! Use a maximum of 2-3 emojis per post, only as subtle bullet points (e.g., ↳, 💡, ⚡). Too many emojis make the post look like multi-level marketing spam.
5. NO raw markdown bold (** or *) or headers (#) in any of the social variants. They render as ugly raw characters on social feeds.

STRICT PLATFORM SPECIFICATIONS:

1. **Twitter/X**:
   - Language: 100% Vietnamese.
   - Style: Sharp, technical, highly opinionated. Maximum 280 characters.
   - Hook: A contrarian take or a massive numbers-driven milestone. Start directly. No hashtags.

2. **Facebook (Dual-Version)**:
   - Structure: Generate TWO separate, pure-language versions of this article (one 100% English and one 100% Vietnamese).
   - Format: Story-driven post (300-500 words). Read like an insightful personal blog post.
   - **English Version** (wrapped in '<facebook_en>'):
     - Hook: A pattern-interrupt opening that sparks curiosity or tells a story.
     - Body: Smooth, narrative flow explaining the technical journey, practical workflow, and system implications.
     - Bullet points: Use custom Unicode bullets like "↳" or "•" sparingly.
     - CTA: A highly engaging, conversational question inviting opinions or discussion in the comments.
   - **Vietnamese Version** (wrapped in '<facebook_vi>'):
     - Format: Follow the exact same professional format, layout, and structure as the English version, but 100% in natural, engaging, and rich Vietnamese.
     - Do NOT translate literally. Write in natural, native Vietnamese phrasing.
     - CTA: A highly conversational question to spark intensive discussion.

3. **LinkedIn**:
   - Language: 100% English.
   - Style: High B2B authority, developer-focused, technical.
   - Focus: Architectural shifts, engineering impact, and strategic business value.
   - Formatting: Use ↳ and clean Unicode lists. No bold/italics.

4. **Instagram**:
   - Language: 100% English.
   - Style: Visual-first, highly inspiring caption. Start with a pattern-interrupt technical hook, followed by 3 key takeaways with ↳.

5. **Threads**:
   - Language: 100% Vietnamese.
   - Style: Extremely casual, conversational, like chatting in a developer forum.
   - MUST break the long content into sequential sections using a single "---" divider on a new line. Keep each section under 450 characters (strictly <= 500 characters limit) so it splits perfectly into a thread of comments. The first section is the main thread post (with the hook), and subsequent sections are the comments.

Output format must be wrapped in XML-like tags:
<twitter>x_copy_here</twitter>
<facebook_en>fb_en_copy_here</facebook_en>
<facebook_vi>fb_vi_copy_here</facebook_vi>
<linkedin>li_copy_here</linkedin>
<instagram>ig_copy_here</instagram>
<tiktok>tt_copy_here</tiktok>
<threads>threads_copy_here</threads>
<visual_prompt>detailed_30_word_image_prompt_for_sdxl_here</visual_prompt>`;

  const userPrompt = `TOPIC: ${topic}\n\nDESCRIPTION: ${description}\n\n${searchContext ? `ADDITIONAL REAL-TIME SEARCH CONTEXT (USE FOR DETAILED FACTS, NUMBERS, AND REAL NEWS UPDATES - DO NOT HALLUCINATE): \n${searchContext}` : ''}`;
  
  try {
    const response = await callLLM(systemPrompt, userPrompt);

    const extractTag = (tag: string) => {
      const match = response.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
      if (!match) return '';
      let content = match[1].trim();
      // Defensively strip any accidental duplicate or nested XML tags
      content = content.replace(new RegExp(`<${tag}>`, 'gi'), '');
      content = content.replace(new RegExp(`</${tag}>`, 'gi'), '');
      return content.trim();
    };

    const fbEn = extractTag('facebook_en');
    const fbVi = extractTag('facebook_vi');
    const fb = fbEn && fbVi ? `${fbEn}\n\n===FB_VERSION_SPLIT===\n\n${fbVi}` : (fbEn || fbVi || extractTag('facebook'));

    return {
      x: extractTag('twitter'),
      fb,
      li: extractTag('linkedin'),
      ig: extractTag('instagram'),
      tt: extractTag('tiktok'),
      threads: extractTag('threads'),
      visualPrompt: extractTag('visual_prompt')
    };
  } catch (llmErr) {
    console.warn('⚠️ Server-side LLM social variant generation failed (quota limit), using high-fidelity B2B offline templates:', llmErr);
    
    // Construct premium B2B templates offline as a solid fallback
    const fbEn = `How often do we build complex systems only to realize we're drowning in manual friction?

Lately, I've been deep in the engineering trenches solving a massive scale bottleneck: ${topic}.

Here is the exact technical reality:
↳ Core architecture: ${description}

In technology, the biggest trap is chasing superficial hype. The real value is always in solving deterministic, high-signal problems.

What is your take on this workflow? Let's discuss in the comments below! 🚀`;

    const fbVi = `Bao nhiêu lần anh em tự xây dựng những hệ thống phức tạp, để rồi nhận ra mình đang ngập đầu trong những quy trình thủ công lặp đi lặp lại?

Mấy hôm nay mình dành toàn bộ thời gian trong "phòng tối" để giải quyết một nút thắt kỹ thuật cực kỳ nhức nhối: ${topic}.

Thực tế câu chuyện là:
↳ Kiến trúc cốt lõi: ${description}

Trong giới công nghệ, cái bẫy lớn nhất là chạy theo các trào lưu hời hợt bên ngoài. Giá trị thực sự luôn nằm ở việc giải quyết triệt để những bài toán thực tế, mang lại hiệu suất tối ưu và giải phóng sức lao động.

Anh em thấy hướng đi này thế nào? Cùng thảo luận dưới phần bình luận nhé! 👇`;

    const fb = `${fbEn}\n\n===FB_VERSION_SPLIT===\n\n${fbVi}`;

    const x = `90% coder nghĩ tối ưu hệ thống là chuyện xa vời. Nhưng thực tế kỹ thuật lại khác: ${topic}.

Kiến trúc cốt lõi:
↳ ${description.slice(0, 160)}...

Giải quyết triệt để nút thắt, scale hiệu suất lên gấp nhiều lần. Zero hype. ⚡`;

    const li = `Many technical leaders think scaling is about throwing more compute at the problem. The engineering reality is different.

We recently tackled a significant architectural shift: ${topic}.

Key technical takeaways for builders and enterprise architects:
↳ Core mechanism: ${description}
↳ Impact: Eliminates complex manual friction, boosting operational efficiency up to 100x.
↳ Outlook: Restructures the workflow to lay a robust foundation for next-gen intelligent automation.

In the current tech landscape, the winners are those who solve high-signal, deterministic problems with clear unit economics.

How is your team optimizing its core workflows this year? Let's connect.`;

    const ig = `The biggest trap in AI is building superficial wrappers. Real value is in solving deterministic engineering problems.

Deep dive into: ${topic}.
↳ Architectural core: ${description}

Key lessons for technical leaders:
• Infrastructure optimization is always the primary bottleneck.
• Keep the micro-architecture clean and modular.
• Solve for actual workflow efficiency, not abstract hype.

👉 Click the link in bio for the complete, step-by-step architectural breakdown!`;

    const tt = `[VISUAL: Tech studio background with floating holographic UI elements]
[ANNOTATION: AI & Tech Breakthroughs 2026]

Here is the technical reality of ${topic}.
The core breakthrough lies in: ${description}.

As a tech founder, here is what you need to know:
1. Unit economics is king.
2. Avoid generic hype.
3. Focus on deterministic engineering.`;

    const threads = `Cực kỳ chấn động anh em ạ: ${topic}! Lần này thực sự thay đổi cuộc chơi rồi. 🤯
---
Thực tế câu chuyện kỹ thuật đằng sau là:
↳ ${description}
---
Từ góc nhìn của mình, cái bẫy lớn nhất của các developer hiện tại là chạy theo trào lưu AI hời hợt. Giá trị thực sự luôn nằm ở việc giải quyết triệt để bài toán thực tế và tối ưu hiệu suất vận hành.
---
Anh em nghĩ sao về đột phá này? Liệu nó có giúp scale quy trình làm việc của anh em lên gấp nhiều lần không? Cùng chia sẻ góc nhìn dưới bình luận nhé! 👇`;

    const visualPrompt = `Futuristic technological abstract concept matching ${topic}, glowing neon cyan and violet highlights, premium glassmorphism, octane render, 3d, cinematic lighting.`;

    return { x, fb, li, ig, tt, threads, visualPrompt };
  }
}

export async function createPostFromBriefingItem(title: string, description: string, pillar: string = 'tech_deep_dive') {
  try {
    const structuredContent = `🎯 TIÊU ĐIỂM: ${title}\n\n📝 CHI TIẾT: ${description}`;
    
    // Perform a live Tavily web search on the news title to fetch the top 5 articles/contents!
    let searchContext = '';
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (tavilyKey) {
      console.log(`🔍 [Tavily Search] Fetching live details for post generation: "${title}"...`);
      try {
        const searchRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: `${title} latest news details facts 2026`,
            search_depth: 'advanced',
            max_results: 5
          })
        });
        const searchData = await searchRes.json();
        const results = searchData.results || [];
        searchContext = results.map((r: any) => `Source: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join('\n\n');
        console.log(`✅ [Tavily Search] Sourced ${results.length} search results for context.`);
      } catch (searchErr: any) {
        console.warn('⚠️ [Tavily Search] failed:', searchErr.message);
      }
    }

    // Generate high-value B2B platform copies & images using our new copywriting engine
    const variants = await generateSocialVariants(title, description, pillar, searchContext);
    
    let coverUrl = await getDynamicAIImage(title);

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO social_posts (
        content, media_urls, content_pillar,
        platform_fb_status, platform_ig_status, platform_x_status, platform_li_status, platform_threads_status,
        content_fb, content_ig, content_x, content_li, content_threads
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      structuredContent,
      JSON.stringify([coverUrl]),
      pillar,
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
      variants.fb,
      variants.ig,
      variants.x,
      variants.li,
      variants.threads
    );
    
    return { success: true, id: info.lastInsertRowid };
  } catch (error: any) {
    console.error('Error creating post from brief item:', error);
    return { success: false, error: error.message };
  }
}

export async function generateFromLatestBrief() {
  try {
    const briefRes = await getLatestBriefingItems();
    if (!briefRes.success || !briefRes.items || briefRes.items.length === 0) {
      throw new Error(briefRes.error || 'No items found in latest news brief');
    }
    
    const topItem = briefRes.items[0];
    const result = await createPostFromBriefingItem(topItem.title, topItem.desc);
    return { success: true, id: result.id, title: topItem.title };
  } catch (error: any) {
    console.error('Error generating post from brief:', error);
    return { success: false, error: error.message };
  }
}

export async function generatePostFromIdea(idea: string, pillar: string) {
  try {
    loadSecondBrainEnv();
    
    // Tavily search first to gather details about the idea!
    let searchContext = '';
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (tavilyKey) {
      console.log(`🔍 [Tavily Search] Sourcing facts for idea: "${idea}"...`);
      try {
        const searchRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: `${idea} tech news details 2026`,
            search_depth: 'advanced',
            max_results: 5
          })
        });
        const searchData = await searchRes.json();
        const results = searchData.results || [];
        searchContext = results.map((r: any) => `Source: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join('\n\n');
        console.log(`✅ [Tavily Search] Sourced ${results.length} search results for context.`);
      } catch (searchErr: any) {
        console.warn('⚠️ [Tavily Search] failed:', searchErr.message);
      }
    }

    // 1. Let the LLM formulate a professional Topic and Description from the raw idea and search context
    const systemPrompt = `You are an expert technical writer and product copywriter.
Analyze the user's raw, informal idea/thought and the provided live search results, and formulate a highly polished, professional B2B Topic (under 80 characters) and a detailed Description (1-2 paragraphs summarizing the technical facts, engineering context, or strategic business value).
Your output must be a valid JSON object with "title" and "description" fields. Output ONLY the JSON with no markdown formatting.`;

    const llmResponse = await callLLM(systemPrompt, `RAW IDEA: ${idea}\nCONTENT PILLAR: ${pillar}\n\nSEARCH CONTEXT:\n${searchContext}`);
    const cleanJson = llmResponse.match(/\{[\s\S]*\}/)?.[0] || llmResponse;
    const parsed = JSON.parse(cleanJson);
    const title = parsed.title || 'Đột Phá Quy Trình Hệ Thống';
    const description = parsed.description || idea;

    const structuredContent = `🎯 TIÊU ĐIỂM: ${title}\n\n📝 CHI TIẾT: ${description}`;

    // 2. Generate the platform-specific variants matching the content pillar!
    const variants = await generateSocialVariants(title, description, pillar, searchContext);

    let coverUrl = await getDynamicAIImage(title);

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO social_posts (
        content, media_urls, content_pillar,
        platform_fb_status, platform_ig_status, platform_x_status, platform_li_status, platform_threads_status,
        content_fb, content_ig, content_x, content_li, content_threads
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      structuredContent,
      JSON.stringify([coverUrl]),
      pillar,
      'pending',
      'pending',
      'pending',
      'pending',
      'pending',
      variants.fb || '',
      variants.ig || '',
      variants.x || '',
      variants.li || '',
      variants.threads || ''
    );

    return { success: true, id: info.lastInsertRowid };
  } catch (error: any) {
    console.error('Error generating post from idea:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePostContent(
  id: number,
  platform: 'fb' | 'ig' | 'x' | 'li' | 'threads',
  newContent: string
) {
  try {
    const db = getDb();
    const columnMap = {
      fb: 'content_fb',
      ig: 'content_ig',
      x: 'content_x',
      li: 'content_li',
      threads: 'content_threads'
    };
    const columnName = columnMap[platform];
    if (!columnName) throw new Error('Invalid platform');

    db.prepare(`UPDATE social_posts SET ${columnName} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newContent, id);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating post content:', error);
    return { success: false, error: error.message };
  }
}
