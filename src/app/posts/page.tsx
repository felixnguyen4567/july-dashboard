'use client';

import { useEffect, useState } from 'react';
import { getSocialPosts, createDummyPost, createCustomPost, publishPost, generateFromLatestBrief, getLatestBriefingItems, createPostFromBriefingItem, generatePostFromIdea, updatePostContent } from './actions';
import { toast } from 'sonner';
import { Share2, Clock, CheckCircle2, AlertCircle, Plus, RefreshCw, MessageSquare, Hash, Send, Briefcase, Rocket, Camera, AtSign, MinusCircle, X, Sparkles, Loader2, Copy } from 'lucide-react';

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImageUrl, setNewPostImageUrl] = useState('');
  const [newPostPillar, setNewPostPillar] = useState('tech_deep_dive');

  // Idea-to-Post states
  const [rawIdea, setRawIdea] = useState('');
  const [ideaPillar, setIdeaPillar] = useState('founder_journal');
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);

  // Briefing selected pillars mapping
  const [briefItemPillars, setBriefItemPillars] = useState<Record<number, string>>({});
  
  // Image Options states
  const [imageType, setImageType] = useState<'text' | 'card' | 'unsplash' | 'link'>('text');
  const [unsplashPhotos, setUnsplashPhotos] = useState<any[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashSearchQuery, setUnsplashSearchQuery] = useState('');
  const [selectedUnsplashPhoto, setSelectedUnsplashPhoto] = useState<string | null>(null);
  const [selectedPreviewPost, setSelectedPreviewPost] = useState<any | null>(null);
  const [previewTab, setPreviewTab] = useState<'fb' | 'ig' | 'li' | 'threads' | 'x'>('fb');
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [isSavingContent, setIsSavingContent] = useState(false);

  useEffect(() => {
    if (selectedPreviewPost) {
      setEditedTexts({
        fb: getClientPlatformContent('fb', selectedPreviewPost.content, selectedPreviewPost.created_at, selectedPreviewPost),
        ig: getClientPlatformContent('ig', selectedPreviewPost.content, selectedPreviewPost.created_at, selectedPreviewPost),
        li: getClientPlatformContent('li', selectedPreviewPost.content, selectedPreviewPost.created_at, selectedPreviewPost),
        threads: getClientPlatformContent('threads', selectedPreviewPost.content, selectedPreviewPost.created_at, selectedPreviewPost),
        x: getClientPlatformContent('x', selectedPreviewPost.content, selectedPreviewPost.created_at, selectedPreviewPost)
      });
    } else {
      setEditedTexts({});
    }
  }, [selectedPreviewPost]);

  const handleTextChange = (text: string) => {
    setEditedTexts(prev => ({
      ...prev,
      [previewTab]: text
    }));
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleSaveContent = async () => {
    if (!selectedPreviewPost) return;
    setIsSavingContent(true);
    const textToSave = editedTexts[previewTab] || '';
    try {
      const result = await updatePostContent(selectedPreviewPost.id, previewTab, textToSave);
      if (result.success) {
        toast.success(`Successfully saved edited content for ${previewTab.toUpperCase()}!`);
        
        // Update local posts list
        setPosts(prevPosts => prevPosts.map(p => {
          if (p.id === selectedPreviewPost.id) {
            const columnMap = {
              fb: 'content_fb',
              ig: 'content_ig',
              x: 'content_x',
              li: 'content_li',
              threads: 'content_threads'
            };
            const col = columnMap[previewTab];
            return { ...p, [col]: textToSave };
          }
          return p;
        }));

        // Update selectedPreviewPost too so UI updates
        setSelectedPreviewPost((prev: any) => {
          if (!prev) return null;
          const columnMap = {
            fb: 'content_fb',
            ig: 'content_ig',
            x: 'content_x',
            li: 'content_li',
            threads: 'content_threads'
          };
          const col = columnMap[previewTab];
          return { ...prev, [col]: textToSave };
        });
      } else {
        toast.error('Failed to save content: ' + result.error);
      }
    } catch (err: any) {
      toast.error('Error saving content: ' + err.message);
    } finally {
      setIsSavingContent(false);
    }
  };

  // Briefing items selection states
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [briefItems, setBriefItems] = useState<any[]>([]);
  const [briefLoading, setBriefLoading] = useState(false);
  const [generatingBriefId, setGeneratingBriefId] = useState<number | null>(null);

  const getClientPlatformContent = (platform: 'fb' | 'ig' | 'li' | 'threads' | 'x', content: string, createdAt: string, post?: any) => {
    if (post) {
      if (platform === 'fb' && post.content_fb) return post.content_fb;
      if (platform === 'ig' && post.content_ig) return post.content_ig;
      if (platform === 'x' && post.content_x) return post.content_x;
      if (platform === 'li' && post.content_li) return post.content_li;
      if (platform === 'threads' && post.content_threads) return post.content_threads;
    }
    const titleMatch = content.match(/🎯\s*TIÊU\s*ĐIỂM:\s*(.+?)(?:\n|$)/i);
    const descMatch = content.match(/📝\s*CHI\s*TIẾT:\s*([\s\S]+)$/i);
    
    if (!titleMatch || !descMatch) {
      return content;
    }
    
    const title = titleMatch[1].trim();
    const description = descMatch[1].trim();
    
    const createdDate = new Date(createdAt);
    const dateStr = createdDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const enDateStr = createdDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const weekday = createdDate.toLocaleDateString('vi-VN', { weekday: 'long' });
    const enWeekday = createdDate.toLocaleDateString('en-US', { weekday: 'long' });

    switch (platform) {
      case 'li': {
        let enTitle = title;
        let enDesc = description;
        
        if (title.includes('NVIDIA') || title.includes('Singapore')) {
          enTitle = 'NVIDIA to Establish State-of-the-Art Embodied AI R&D Center in Singapore';
          enDesc = 'NVIDIA has announced a strategic plan to build a next-generation Embodied AI R&D Center in Singapore. This landmark facility will leverage NVIDIA Blackwell GPUs, cutting-edge foundation models, and the Omniverse simulation platform to train the next wave of autonomous robots and smart systems, accelerating seamless physical-digital AI interaction.';
        } else if (title.includes('Spotify') || title.includes('Universal') || title.includes('phối')) {
          enTitle = 'Spotify Partners with Universal Music Group for Licensed Premium AI Covers & Remixes';
          enDesc = 'In a pioneering collaboration, Spotify and Universal Music Group (UMG) are integrating AI-powered music tools that allow premium subscribers to legally create AI covers and remixes of copyrighted music. This milestone reshapes the creator economy, ensuring fair copyright compensation while fostering music innovation.';
        } else if (title.includes('Codex') || title.includes('Appshots')) {
          enTitle = 'Codex for Mac Introduces "Appshots" to Instantly Feed Any Window directly to AI';
          enDesc = 'The latest update to Codex assistant on macOS introduces "Appshots", a revolutionary feature letting developers drag-and-drop or snapshot any active application window, UI layout, or design diagram directly into the chat. The AI instantly analyzes code architectures and generates optimized frontend assets in seconds.';
        } else if (title.includes('đèn') || title.includes('điện kính') || title.includes('kính hiển vi') || title.includes('Nguyên Nhãn') || title.includes('Yuanyan')) {
          enTitle = 'World\'s First AI-Autonomous Transmission Electron Microscope "Yuanyan-1" Unveiled';
          enDesc = 'Scientists have successfully developed "Yuanyan-1", the world\'s first intelligent transmission electron microscope (TEM) operated entirely by autonomous AI. The system automates beam alignment, sample navigation, and atomic structure analysis, accelerating nanoscience and cell biology research by up to 100x.';
        } else if (title.includes('CATL') || title.includes('pin') || title.includes('lượng')) {
          enTitle = 'CATL Solidifies Global EV Battery Dominance with 244 GWh Installed in Q1 2026';
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
        let enTitle = title;
        let enDesc = description;
        
        if (title.includes('NVIDIA') || title.includes('Singapore')) {
          enTitle = 'NVIDIA to Establish State-of-the-Art Embodied AI R&D Center in Singapore';
          enDesc = 'NVIDIA has announced a strategic plan to build a next-generation Embodied AI R&D Center in Singapore. This landmark facility will leverage NVIDIA Blackwell GPUs, cutting-edge foundation models, and the Omniverse simulation platform to train the next wave of autonomous robots and smart systems, accelerating seamless physical-digital AI interaction.';
        } else if (title.includes('Spotify') || title.includes('Universal') || title.includes('phối')) {
          enTitle = 'Spotify Partners with Universal Music Group for Licensed Premium AI Covers & Remixes';
          enDesc = 'In a pioneering collaboration, Spotify and Universal Music Group (UMG) are integrating AI-powered music tools that allow premium subscribers to legally create AI covers and remixes of copyrighted music. This milestone reshapes the creator economy, ensuring fair copyright compensation while fostering music innovation.';
        } else if (title.includes('Codex') || title.includes('Appshots')) {
          enTitle = 'Codex for Mac Introduces "Appshots" to Instantly Feed Any Window directly to AI';
          enDesc = 'The latest update to Codex assistant on macOS introduces "Appshots", a revolutionary feature letting developers drag-and-drop or snapshot any active application window, UI layout, or design diagram directly into the chat. The AI instantly analyzes code architectures and generates optimized frontend assets in seconds.';
        } else if (title.includes('đèn') || title.includes('điện kính') || title.includes('kính hiển vi') || title.includes('Nguyên Nhãn') || title.includes('Yuanyan')) {
          enTitle = 'World\'s First AI-Autonomous Transmission Electron Microscope "Yuanyan-1" Unveiled';
          enDesc = 'Scientists have successfully developed "Yuanyan-1", the world\'s first intelligent transmission electron microscope (TEM) operated entirely by autonomous AI. The system automates beam alignment, sample navigation, and atomic structure analysis, accelerating nanoscience and cell biology research by up to 100x.';
        } else if (title.includes('CATL') || title.includes('pin') || title.includes('lượng')) {
          enTitle = 'CATL Solidifies Global EV Battery Dominance with 244 GWh Installed in Q1 2026';
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
        return `Anh em nghĩ sao về việc ${title} vừa diễn ra hôm nay (${weekday}, ngày ${dateStr})? 🤔

Chi tiết: ${description.slice(0, 200)}...

Liệu bước tiến vượt bậc này có giúp mở ra thêm hàng ngàn cơ hội đột phá mới cho các lập trình viên và doanh nghiệp Việt Nam đón đầu làn sóng số không nhỉ? Chia sẻ góc nhìn của anh em dưới bình luận nhé! 👇

#TechChat #AI #Innovation #VietnamTech`;
      }
      case 'x': {
        return `🚀 NÓNG: ${title} (${dateStr})\n\n${description.slice(0, 140)}...\n\n#AI #TechNews #OpenClaw`;
      }
      default:
        return content;
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    const result = await getSocialPosts();
    if (result.success) {
      setPosts(result.posts || []);
    } else {
      toast.error('Failed to fetch posts');
    }
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    getSocialPosts().then(result => {
      if (!mounted) return;
      if (result.success) {
        setPosts(result.posts || []);
      }
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleCreateDummy = async () => {
    toast.info('Creating test post...');
    const result = await createDummyPost();
    if (result.success) {
      toast.success('Test post created!');
      fetchPosts();
    } else {
      toast.error('Failed to create test post');
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      toast.error('Post content is required');
      return;
    }
    
    let resolvedImageUrl: string | undefined = undefined;
    if (imageType === 'card') {
      resolvedImageUrl = '__auto_card__';
    } else if (imageType === 'unsplash') {
      if (!selectedUnsplashPhoto) {
        toast.error('Please select an Unsplash stock photo');
        return;
      }
      resolvedImageUrl = selectedUnsplashPhoto;
    } else if (imageType === 'link') {
      if (!newPostImageUrl.trim()) {
        toast.error('Image URL is required for custom link');
        return;
      }
      resolvedImageUrl = newPostImageUrl;
    }

    toast.info('Creating post...');
    const result = await createCustomPost(newPostContent, resolvedImageUrl, newPostPillar);
    if (result.success) {
      toast.success('Post created successfully!');
      setIsModalOpen(false);
      setNewPostContent('');
      setNewPostImageUrl('');
      setNewPostPillar('tech_deep_dive');
      setSelectedUnsplashPhoto(null);
      setImageType('text');
      fetchPosts();
    } else {
      toast.error('Failed to create post: ' + result.error);
    }
  };
  const handleGenerateFromBrief = async () => {
    setIsBriefModalOpen(true);
    setBriefLoading(true);
    try {
      const result = await getLatestBriefingItems();
      if (result.success) {
        setBriefItems(result.items || []);
      } else {
        toast.error('Failed to load news briefing: ' + result.error);
        setIsBriefModalOpen(false);
      }
    } catch (err: any) {
      toast.error('Error loading briefing: ' + err.message);
      setIsBriefModalOpen(false);
    } finally {
      setBriefLoading(false);
    }
  };

  const handleSelectBriefItem = async (title: string, desc: string, id: number) => {
    setGeneratingBriefId(id);
    const pillar = briefItemPillars[id] || 'tech_deep_dive';
    toast.info('Generating highly optimized post with dynamic AI artwork...');
    try {
      const result = await createPostFromBriefingItem(title, desc, pillar);
      if (result.success) {
        toast.success(`Post successfully queued!`);
        setIsBriefModalOpen(false);
        fetchPosts();
      } else {
        toast.error('Failed to generate post: ' + result.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setGeneratingBriefId(null);
    }
  };

  const handleGenerateFromIdea = async () => {
    if (!rawIdea.trim()) return;
    setIsGeneratingIdea(true);
    toast.info('Đang phác thảo bài viết chuyên sâu & thiết kế ảnh phủ...');
    try {
      const result = await generatePostFromIdea(rawIdea, ideaPillar);
      if (result.success) {
        toast.success('Đã biến ý tưởng thành bài đăng đa kênh & lưu vào hàng đợi!');
        setRawIdea('');
        fetchPosts();
      } else {
        toast.error('Không thể sinh bài viết: ' + result.error);
      }
    } catch (err: any) {
      toast.error('Lỗi hệ thống: ' + err.message);
    } finally {
      setIsGeneratingIdea(false);
    }
  };
  const extractKeywords = (text: string) => {
    if (!text) return 'technology';
    const cleanText = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = cleanText.split(' ')
      .filter(w => w.length > 4 && !['about', 'would', 'their', 'there', 'these', 'could', 'should', 'would', 'really', 'under', 'after', 'before', 'where', 'while'].includes(w));
    
    return words.slice(0, 2).join(' ') || 'technology';
  };

  const searchUnsplash = async (query: string) => {
    setUnsplashLoading(true);
    try {
      const res = await fetch(`/api/social/media/unsplash?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setUnsplashPhotos(data.photos || []);
      } else {
        toast.error('Unsplash error: ' + data.error);
      }
    } catch (err: any) {
      toast.error('Search failed: ' + err.message);
    } finally {
      setUnsplashLoading(false);
    }
  };

  const handleTabChange = (tab: 'text' | 'card' | 'unsplash' | 'link') => {
    setImageType(tab);
    if (tab === 'unsplash' && unsplashPhotos.length === 0) {
      const keywords = extractKeywords(newPostContent);
      setUnsplashSearchQuery(keywords);
      searchUnsplash(keywords);
    }
  };

  const handlePublish = async (id: number) => {
    setPublishingId(id);
    toast.info('Publishing post to platforms...');
    const result = await publishPost(id);
    if (result.success) {
      toast.success('Post published successfully!');
      fetchPosts();
    } else {
      toast.error('Failed to publish: ' + result.error);
    }
    setPublishingId(null);
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'success' || status === 'published') return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (status === 'pending') return <Clock className="w-4 h-4 text-amber-400" />;
    if (status === 'skipped') return <MinusCircle className="w-4 h-4 text-white/30" />;
    return <AlertCircle className="w-4 h-4 text-red-400" />;
  };

  const PlatformStatus = ({ platform, status }: { platform: string, status: string }) => {
    let Icon = MessageSquare;
    if (platform === 'x') Icon = Send;
    if (platform === 'li') Icon = Briefcase;
    if (platform === 'ig') Icon = Camera;
    if (platform === 'threads') Icon = AtSign;

    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10" title={`${platform}: ${status}`}>
        <Icon className="w-3.5 h-3.5 text-white/60" />
        <StatusIcon status={status} />
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Content Queue</h1>
          <p className="text-white/60 mt-1">Review, edit, and approve posts before they are published.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchPosts}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleGenerateFromBrief}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-purple-500/10 border border-purple-500/20"
          >
            <Sparkles className="w-4 h-4 animate-pulse text-yellow-300" />
            Gen from Briefing
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>
      </div>

      {/* Idea-to-Post Generator Card */}
      <div className="glass-panel p-6 relative overflow-hidden space-y-4 animate-in slide-in-from-top-4 duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-purple-500/5 blur-3xl" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            <div>
              <h2 className="text-base font-bold text-white">Ý Tưởng Thành Bài Viết Đa Kênh (Idea-to-Post)</h2>
              <p className="text-xs text-white/50">Ghi lại suy nghĩ ngẫu hứng của anh, AI sẽ tự động biến thành bài viết chất lượng cao.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <select
              value={ideaPillar}
              onChange={(e) => setIdeaPillar(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-primary focus:outline-none transition-all"
            >
              <option value="tech_deep_dive">🔬 Phân tích Công nghệ (Tech Deep-Dive)</option>
              <option value="founder_journal">📝 Nhật ký Sáng lập (Founder Journal)</option>
              <option value="dev_tip">🛠️ Mẹo Lập trình (Dev Tip & Workflow)</option>
              <option value="trend_forecast">🔮 Dự báo Xu hướng & Dữ liệu AI (AI Trends & Datasets)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full space-y-1">
            <textarea
              rows={2}
              value={rawIdea}
              onChange={(e) => setRawIdea(e.target.value)}
              placeholder="Nhập ý tưởng thô của anh tại đây (Ví dụ: So sánh mô hình GPT-4o với Claude 3.5 Sonnet hoặc Top 5 công cụ AI nâng cao năng suất...)"
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all custom-scrollbar resize-none"
            />
          </div>
          <button
            onClick={handleGenerateFromIdea}
            disabled={isGeneratingIdea || !rawIdea.trim()}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-white/10 disabled:to-white/10 disabled:text-white/45 disabled:border-white/5 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-500/10 border border-purple-500/20"
          >
            {isGeneratingIdea ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Đang Sáng Tạo...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                Sáng Tạo Bài Viết
              </>
            )}
          </button>
        </div>

        {/* Sleek Topic Suggestions */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block">Gợi ý chủ đề công cụ & xu hướng AI hôm nay (Click để chọn nhanh):</label>
          <div className="flex flex-wrap gap-2">
            {[
              {
                text: "Cursor vs VS Code: Tại sao 90% developer chuyển sang dùng Cursor vẫn mắc sai lầm cốt lõi này?",
                pillar: "tech_deep_dive",
                label: "💻 Cursor vs VS Code"
              },
              {
                text: "Kỷ nguyên Local LLM: Chạy Llama 3.1 offline trên Macbook - Khi nào nên từ bỏ OpenAI API?",
                pillar: "trend_forecast",
                label: "🔮 Local LLM on Mac"
              },
              {
                text: "Tối ưu hóa RAG: Tại sao 80% dự án RAG thực tế thất bại vì bỏ qua bước làm sạch dữ liệu OCR?",
                pillar: "tech_deep_dive",
                label: "🛠️ Tối ưu RAG & OCR"
              },
              {
                text: "Bẫy AI Agent 2026: Khi nào quy trình tự động hóa thực sự cần thiết và khi nào chỉ là hype?",
                pillar: "trend_forecast",
                label: "📝 Bẫy AI Agent 2026"
              }
            ].map((suggest, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setRawIdea(suggest.text);
                  setIdeaPillar(suggest.pillar);
                  toast.success(`Đã chọn chủ đề: ${suggest.label}`);
                }}
                className="text-[11px] font-medium px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 text-white/70 hover:text-white transition-all duration-200"
              >
                {suggest.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white/50 uppercase bg-black/20 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Content Preview</th>
                <th className="px-6 py-4 font-medium">Platforms</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {posts.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-white/50">
                    <Share2 className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    No posts in the queue. Create one to get started!
                  </td>
                </tr>
              )}
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <p className="text-white/90 line-clamp-2">{post.content}</p>
                      {post.media_urls && (
                        <span className="inline-block mt-2 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                          Includes Media
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <PlatformStatus platform="fb" status={post.platform_fb_status} />
                      <PlatformStatus platform="ig" status={post.platform_ig_status} />
                      <PlatformStatus platform="x" status={post.platform_x_status} />
                      <PlatformStatus platform="li" status={post.platform_li_status} />
                      <PlatformStatus platform="threads" status={post.platform_threads_status || 'pending'} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/60 whitespace-nowrap">
                    {new Date(post.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handlePublish(post.id)}
                        disabled={publishingId === post.id}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 transition-all disabled:opacity-50"
                      >
                        <Rocket className="w-3.5 h-3.5 animate-pulse" />
                        {publishingId === post.id ? 'Publishing...' : 'Publish'}
                      </button>
                      <button 
                        onClick={() => setSelectedPreviewPost(post)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Glassmorphic Modal for custom posts */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                Create Social Post
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Post Content</label>
                <textarea
                  required
                  rows={4}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What would you like to share across your social accounts?"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Content Pillar</label>
                <select
                  value={newPostPillar}
                  onChange={(e) => setNewPostPillar(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none transition-all"
                >
                  <option value="tech_deep_dive">🔬 Tech Deep-Dive (Phân tích công nghệ)</option>
                  <option value="founder_journal">📝 Founder Journal (Nhật ký sáng lập)</option>
                  <option value="dev_tip">🛠️ Dev Tip & Workflow (Mẹo lập trình)</option>
                  <option value="trend_forecast">🔮 AI & Tech Forecast (Dự báo xu hướng)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center justify-between">
                  <span>Visual Attachment</span>
                  {imageType === 'text' && <span className="text-[10px] text-amber-400 font-normal normal-case">Text-only (IG will skip)</span>}
                  {imageType === 'card' && <span className="text-[10px] text-green-400 font-normal normal-case">✨ Branded social card</span>}
                  {imageType === 'unsplash' && <span className="text-[10px] text-pink-400 font-normal normal-case">📸 Unsplash stock search</span>}
                  {imageType === 'link' && <span className="text-[10px] text-blue-400 font-normal normal-case">🔗 Custom image URL</span>}
                </label>

                {/* Segmented control tabs */}
                <div className="flex rounded-xl bg-white/[0.03] border border-white/10 p-0.5">
                  <button
                    type="button"
                    onClick={() => handleTabChange('text')}
                    className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                      imageType === 'text'
                        ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    📝 Text
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('card')}
                    className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                      imageType === 'card'
                        ? 'bg-gradient-to-br from-primary/30 to-pink-500/30 text-white border border-primary/20 shadow-sm'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    ✨ Auto Card
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('unsplash')}
                    className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                      imageType === 'unsplash'
                        ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    📸 Stock Search
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('link')}
                    className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                      imageType === 'link'
                        ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    🔗 Custom Link
                  </button>
                </div>

                {/* Content based on imageType selection */}
                {imageType === 'card' && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.01] p-4 flex flex-col items-center justify-center space-y-3 relative overflow-hidden min-h-[160px] animate-in fade-in duration-200">
                    {/* Glowing mesh nodes */}
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-pink-500/5 blur-xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-purple-500/5 blur-xl" />
                    
                    <div className="w-full flex justify-between items-center text-[8px] text-white/30 uppercase tracking-widest pb-1.5 border-b border-white/5 z-10">
                      <span>OpenClaw Social Card</span>
                      <span className="text-pink-400 font-semibold">Live Typing Preview</span>
                    </div>
                    <div className="w-full text-left py-2 flex-grow z-10">
                      <p className="text-xs font-bold text-white/80 line-clamp-3 leading-relaxed">
                        {newPostContent || 'Draft your post content above to preview your beautiful social share card...'}
                      </p>
                    </div>
                    <div className="w-full flex items-center justify-between text-[7px] text-white/20 pt-1.5 border-t border-white/5 z-10">
                      <span>⚡ Automated by OpenClaw</span>
                      <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                )}

                {imageType === 'unsplash' && (
                  <div className="space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={unsplashSearchQuery}
                        onChange={(e) => setUnsplashSearchQuery(e.target.value)}
                        placeholder="Search stock photos..."
                        className="flex-grow rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            searchUnsplash(unsplashSearchQuery);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => searchUnsplash(unsplashSearchQuery)}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors"
                      >
                        Search
                      </button>
                    </div>

                    {unsplashLoading ? (
                      <div className="h-32 flex items-center justify-center text-xs text-white/40">
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Fetching photos...
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[160px] p-0.5 custom-scrollbar">
                        {unsplashPhotos.map((photo) => (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => setSelectedUnsplashPhoto(photo.url)}
                            className={`group relative aspect-square rounded-lg overflow-hidden border transition-all ${
                              selectedUnsplashPhoto === photo.url
                                ? 'border-primary ring-2 ring-primary/40'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                            title={`Photo by ${photo.photographer}`}
                          >
                            <img
                              src={photo.thumbnail}
                              alt={photo.description}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {selectedUnsplashPhoto === photo.url && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 text-[7px] text-white/80 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                              {photo.photographer}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {imageType === 'link' && (
                  <div className="animate-in fade-in duration-200">
                    <input
                      type="url"
                      value={newPostImageUrl}
                      onChange={(e) => setNewPostImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleCreateDummy}
                  className="text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
                >
                  Create Dummy Post instead
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors"
                  >
                    Create Post
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic View/Preview Modal */}
      {selectedPreviewPost && (() => {
        let previewImageUrl = '';
        if (selectedPreviewPost.media_urls) {
          try {
            const urls = JSON.parse(selectedPreviewPost.media_urls);
            previewImageUrl = Array.isArray(urls) ? urls[0] : selectedPreviewPost.media_urls;
          } catch {
            previewImageUrl = selectedPreviewPost.media_urls;
          }
          
          if (previewImageUrl === '__auto_card__') {
            previewImageUrl = `/api/social/media/og?title=${encodeURIComponent(selectedPreviewPost.content)}`;
          }
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950/85 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Post Preview & Diagnostics
                </h3>
                <button 
                  onClick={() => setSelectedPreviewPost(null)}
                  className="rounded-full p-1 text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left side: Post content & status */}
                <div className="space-y-4">
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider flex justify-between items-center">
                      <span>Post Content Preview</span>
                      <span className="text-[9px] text-primary lowercase tracking-normal">select platform to view customized copy</span>
                    </label>
                    {/* Platform Tab Switcher for Preview */}
                    <div className="flex rounded-lg bg-white/[0.03] border border-white/10 p-0.5 text-[9px] font-semibold mb-1">
                      {(['fb', 'ig', 'li', 'threads', 'x'] as const).map((plat) => (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => setPreviewTab(plat)}
                          className={`flex-1 py-1 rounded-md transition-all uppercase ${
                            previewTab === plat
                              ? 'bg-white/10 text-white shadow-sm'
                              : 'text-white/45 hover:text-white/85'
                          }`}
                        >
                          {plat === 'li' ? 'LinkedIn' : plat === 'fb' ? 'Facebook' : plat === 'ig' ? 'Instagram' : plat}
                        </button>
                      ))}
                    </div>
                    <div className="h-[220px] overflow-y-auto custom-scrollbar space-y-3">
                      {previewTab === 'fb' && editedTexts.fb?.includes('===FB_VERSION_SPLIT===') ? (
                        (() => {
                          const fbText = editedTexts.fb || '';
                          const parts = fbText.split('===FB_VERSION_SPLIT===');
                          const fbEn = parts[0] ? parts[0].trim() : '';
                          const fbVi = parts[1] ? parts[1].trim() : '';
                          
                          return (
                            <div className="space-y-3.5">
                              <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-3 space-y-1.5 animate-in fade-in duration-200">
                                <div className="font-bold text-[10px] text-blue-400 uppercase tracking-widest flex items-center justify-between border-b border-blue-500/10 pb-1.5">
                                  <span>🇬🇧 ENGLISH VERSION (Post #1)</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToClipboard(fbEn)}
                                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 active:scale-95 transition-all"
                                  >
                                    <Copy className="w-3 h-3" /> Copy EN
                                  </button>
                                </div>
                                <textarea
                                  value={fbEn}
                                  onChange={(e) => {
                                    const newEn = e.target.value;
                                    handleTextChange(newEn + '\n\n===FB_VERSION_SPLIT===\n\n' + fbVi);
                                  }}
                                  rows={5}
                                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all custom-scrollbar resize-none"
                                />
                              </div>
                              <div className="rounded-xl border border-green-500/10 bg-green-500/5 p-3 space-y-1.5 animate-in fade-in duration-200">
                                <div className="font-bold text-[10px] text-green-400 uppercase tracking-widest flex items-center justify-between border-b border-green-500/10 pb-1.5">
                                  <span>🇻🇳 PHIÊN BẢN TIẾNG VIỆT (Post #2)</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToClipboard(fbVi)}
                                    className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-1 font-medium bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 active:scale-95 transition-all"
                                  >
                                    <Copy className="w-3 h-3" /> Copy VI
                                  </button>
                                </div>
                                <textarea
                                  value={fbVi}
                                  onChange={(e) => {
                                    const newVi = e.target.value;
                                    handleTextChange(fbEn + '\n\n===FB_VERSION_SPLIT===\n\n' + newVi);
                                  }}
                                  rows={5}
                                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all custom-scrollbar resize-none"
                                />
                              </div>
                            </div>
                          );
                        })()
                      ) : previewTab === 'threads' ? (
                        (() => {
                          const threadsText = editedTexts.threads || '';
                          let rawChunks: string[] = [];
                          if (threadsText.includes('\n---\n')) {
                            rawChunks = threadsText.split('\n---\n').map((c: string) => c.trim()).filter(Boolean);
                          } else if (threadsText.includes('\n---')) {
                            rawChunks = threadsText.split(/\n---[^\n]*/).map((c: string) => c.trim()).filter(Boolean);
                          } else {
                            rawChunks = [threadsText];
                          }

                          const chunks: string[] = [];
                          for (const chunk of rawChunks) {
                            if (chunk.length > 500) {
                              let textToSplit = chunk;
                              while (textToSplit.length > 500) {
                                let splitIdx = textToSplit.lastIndexOf(' ', 500);
                                if (splitIdx === -1 || splitIdx < 400) {
                                  splitIdx = 500;
                                }
                                chunks.push(textToSplit.slice(0, splitIdx).trim());
                                textToSplit = textToSplit.slice(splitIdx).trim();
                              }
                              if (textToSplit.trim()) {
                                chunks.push(textToSplit.trim());
                              }
                            } else {
                              chunks.push(chunk);
                            }
                          }

                          return (
                            <div className="space-y-3.5">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-white/50 uppercase font-semibold">Threads Content (Use `---` to separate comment replies)</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToClipboard(threadsText)}
                                    className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 font-medium bg-primary/10 px-2 py-0.5 rounded border border-primary/20 active:scale-95 transition-all"
                                  >
                                    <Copy className="w-3 h-3" /> Copy Full Text
                                  </button>
                                </div>
                                <textarea
                                  value={threadsText}
                                  onChange={(e) => handleTextChange(e.target.value)}
                                  rows={5}
                                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all custom-scrollbar"
                                />
                              </div>

                              <div className="space-y-2 border-t border-white/5 pt-2">
                                <span className="text-[9px] font-semibold text-white/40 uppercase tracking-wider block">Live Thread Preview ({chunks.length} posts)</span>
                                <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                                  {chunks.map((chunk, idx) => (
                                    <div key={idx} className="relative pl-5 border-l-2 border-primary/20 py-1">
                                      <div className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center text-[7px] text-white font-bold shadow-md shadow-primary/30">
                                        {idx + 1}
                                      </div>
                                      <div className="font-semibold text-[9px] text-primary uppercase tracking-wider mb-0.5 flex items-center justify-between">
                                        <span>{idx === 0 ? 'Main Post' : `Comment Reply #${idx}`}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[8px] text-white/30 lowercase font-normal">({chunk.length} chars)</span>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyToClipboard(chunk)}
                                            className="text-[8px] text-white/40 hover:text-white/70 active:scale-95 transition-all"
                                          >
                                            Copy part
                                          </button>
                                        </div>
                                      </div>
                                      <p className="text-white/80 whitespace-pre-wrap text-[10px] leading-normal">{chunk}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/50 uppercase font-semibold">Edit {previewTab.toUpperCase()} Copy</span>
                            <button
                              type="button"
                              onClick={() => handleCopyToClipboard(editedTexts[previewTab] || '')}
                              className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 font-medium bg-primary/10 px-2 py-0.5 rounded border border-primary/20 active:scale-95 transition-all"
                            >
                              <Copy className="w-3 h-3" /> Copy Text
                            </button>
                          </div>
                          <textarea
                            value={editedTexts[previewTab] || ''}
                            onChange={(e) => handleTextChange(e.target.value)}
                            rows={8}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all custom-scrollbar"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Platform Statuses</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                        <span className="text-white/60">Facebook</span>
                        <StatusIcon status={selectedPreviewPost.platform_fb_status} />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                        <span className="text-white/60">Instagram</span>
                        <StatusIcon status={selectedPreviewPost.platform_ig_status} />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                        <span className="text-white/60">X (Twitter)</span>
                        <StatusIcon status={selectedPreviewPost.platform_x_status} />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                        <span className="text-white/60">LinkedIn</span>
                        <StatusIcon status={selectedPreviewPost.platform_li_status} />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 col-span-2">
                        <span className="text-white/60">Threads</span>
                        <StatusIcon status={selectedPreviewPost.platform_threads_status || 'pending'} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Visual Attachment Preview */}
                <div className="space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5 flex-grow flex flex-col">
                    <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Visual Attachment</label>
                    
                    {previewImageUrl === '__auto_card__' ? (
                      /* High-fidelity live dynamic card preview */
                      <div className="rounded-xl border border-white/10 bg-white/[0.01] p-4 flex flex-col items-center justify-center space-y-3 relative overflow-hidden flex-grow min-h-[160px]">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-pink-500/5 blur-xl animate-pulse" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-purple-500/5 blur-xl animate-pulse" />
                        
                        <div className="w-full flex justify-between items-center text-[7px] text-white/30 uppercase tracking-widest pb-1 border-b border-white/5 z-10">
                          <span>OpenClaw Social Card</span>
                          <span className="text-pink-400 font-semibold">Branded Template</span>
                        </div>
                        <div className="w-full text-left py-2 flex-grow z-10 flex items-center">
                          <p className="text-[10px] font-bold text-white leading-relaxed line-clamp-4">
                            {selectedPreviewPost.content}
                          </p>
                        </div>
                        <div className="w-full flex items-center justify-between text-[6px] text-white/20 pt-1 border-t border-white/5 z-10">
                          <span>⚡ Automated by OpenClaw</span>
                          <span>{new Date(selectedPreviewPost.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    ) : previewImageUrl ? (
                      /* Real Image (Unsplash or Link) Preview */
                      <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden flex-grow flex items-center justify-center min-h-[160px] relative group">
                        <img 
                          src={previewImageUrl} 
                          alt="Post attachment" 
                          className="w-full h-full object-cover max-h-[160px]" 
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center text-[8px] text-white/80 truncate">
                          {previewImageUrl}
                        </div>
                      </div>
                    ) : (
                      /* Text only */
                      <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 flex flex-col items-center justify-center text-center flex-grow min-h-[160px] text-white/30 space-y-1">
                        <MinusCircle className="w-6 h-6 opacity-40" />
                        <span className="text-[10px]">No visual attachment (Text-only)</span>
                      </div>
                    )}
                  </div>

                  {selectedPreviewPost.error_message && (
                    <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-2 text-left">
                      <label className="text-[8px] font-bold text-red-400 uppercase tracking-wider block">Error Diagnostics</label>
                      <p className="text-[9px] text-red-300 mt-0.5 leading-normal max-h-[50px] overflow-y-auto custom-scrollbar">
                        {selectedPreviewPost.error_message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <button
                  onClick={handleSaveContent}
                  disabled={isSavingContent}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white transition-all disabled:opacity-50"
                >
                  {isSavingContent ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  onClick={() => setSelectedPreviewPost(null)}
                  className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition-colors text-white"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dynamic News Brief Selection Modal */}
      {isBriefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950/85 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                Select Morning Story (Top 5 Virality)
              </h3>
              <button 
                onClick={() => setIsBriefModalOpen(false)}
                className="rounded-full p-1 text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/50 shrink-0">
              Select one of today's top parsed technology & AI stories below to generate a highly detailed multi-channel visual post.
            </p>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0.5 space-y-3">
              {briefLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-sm text-white/40 gap-3">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Parsing latest news briefing...
                </div>
              ) : briefItems.length === 0 ? (
                <div className="py-20 text-center text-sm text-white/40">
                  No news items could be parsed from today's brief.
                </div>
              ) : (
                briefItems.map((item) => (
                  <div 
                    key={item.id}
                    className="group relative rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-4 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          🔥 {item.score}/10 Virality
                        </span>
                        {item.category && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            item.category === 'Công nghệ & AI' 
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                              : item.category === 'Kinh tế' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}>
                            {item.category}
                          </span>
                        )}
                        <span className="text-[10px] text-white/30 font-medium">Story #{item.id}</span>
                      </div>
                      <h4 className="font-semibold text-sm text-white/90 group-hover:text-white transition-colors leading-relaxed">
                        {item.title}
                      </h4>
                      <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      <select
                        value={briefItemPillars[item.id] || 'tech_deep_dive'}
                        onChange={(e) => setBriefItemPillars({ ...briefItemPillars, [item.id]: e.target.value })}
                        className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:outline-none transition-all"
                      >
                        <option value="tech_deep_dive">🔬 Tech Deep-Dive</option>
                        <option value="founder_journal">📝 Founder Journal</option>
                        <option value="dev_tip">🛠️ Dev Tip</option>
                        <option value="trend_forecast">🔮 AI Forecast</option>
                      </select>
                      <button
                        onClick={() => handleSelectBriefItem(item.title, item.desc, item.id)}
                        disabled={generatingBriefId === item.id}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        {generatingBriefId === item.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Generate Visual Post
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10 shrink-0">
              <button
                onClick={() => setIsBriefModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition-colors text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
