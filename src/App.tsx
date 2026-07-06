import React, { useState, useEffect, useRef } from "react";
import { KreativeItem, SubscriptionType, ItemType } from "./types";
import { TEMPLATES } from "./data/templates";
import Dashboard from "./components/Dashboard";
import PricingModule from "./components/PricingModule";
import DocumentEditor from "./components/DocumentEditor";
import PresentationEditor from "./components/PresentationEditor";
import PageBuilder from "./components/PageBuilder";
import VideoEditor from "./components/VideoEditor";
import StoryEditor from "./components/StoryEditor";
import { Sparkles, Layout, Monitor, FileText, Shield, Landmark, User, HelpCircle, Cloud, LogOut } from "lucide-react";
import { initAuth, googleSignIn, logout, getAccessToken, setAccessToken } from "./lib/firebase";
import { 
  getOrCreateKreativeFolder, 
  listKreativeFiles, 
  downloadKreativeFile, 
  createKreativeFile, 
  updateKreativeFile, 
  deleteKreativeFile 
} from "./lib/driveService";
import { User as FirebaseUser } from "firebase/auth";
import { getItemSize, getSubscriptionStorageLimit, formatBytes } from "./lib/storageUtils";

export default function App() {
  // Application tabs: "dashboard" | "pricing" | "editor"
  const [activeTab, setActiveTab] = useState<"dashboard" | "pricing" | "editor">("dashboard");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Authentication & Google Drive State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Timer reference for debouncing saves
  const saveTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Persistence for subscription license
  const [subscription, setSubscription] = useState<SubscriptionType>(() => {
    const saved = localStorage.getItem("kreative_subscription");
    return (saved as SubscriptionType) || "free";
  });

  // AI Usage limit states (for Office Pack and general tracking)
  const [aiUsage, setAiUsage] = useState<number>(() => {
    const saved = localStorage.getItem("kreative_ai_usage");
    return saved ? parseInt(saved, 10) : 142; // default simulated start
  });

  const aiLimit = 500; // AI request limit for Office Pack

  // Watermark-free creations remaining for Office Pack
  const [watermarkFreeLeft, setWatermarkFreeLeft] = useState<number>(() => {
    const saved = localStorage.getItem("kreative_watermark_free_left");
    return saved ? parseInt(saved, 10) : 25;
  });

  // Organization state
  const [orgMembers, setOrgMembers] = useState<Array<{ name: string; role: string; email: string }>>(() => {
    const saved = localStorage.getItem("kreative_org_members");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { name: "Johan Andersson", role: "Lärare", email: "johan@skola.se" },
      { name: "Sara Ekström", role: "Elev", email: "sara.ekstrom@elev.se" },
      { name: "Erik Lindqvist", role: "Elev", email: "erik.lind@elev.se" },
      { name: "Lina Berg", role: "Administratör", email: "lina.berg@skola.se" },
    ];
  });

  const [inviteCodes, setInviteCodes] = useState<string[]>(() => {
    const saved = localStorage.getItem("kreative_invite_codes");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return ["KREATIVE-ORG-78A3", "KREATIVE-ORG-1192"];
  });

  // Sync state changes on update
  useEffect(() => {
    localStorage.setItem("kreative_ai_usage", aiUsage.toString());
  }, [aiUsage]);

  useEffect(() => {
    localStorage.setItem("kreative_watermark_free_left", watermarkFreeLeft.toString());
  }, [watermarkFreeLeft]);

  const handleDecrementWatermarkFree = () => {
    if (subscription === "office") {
      setWatermarkFreeLeft((prev) => {
        const next = Math.max(0, prev - 1);
        return next;
      });
    }
  };

  useEffect(() => {
    localStorage.setItem("kreative_org_members", JSON.stringify(orgMembers));
  }, [orgMembers]);

  useEffect(() => {
    localStorage.setItem("kreative_invite_codes", JSON.stringify(inviteCodes));
  }, [inviteCodes]);

  const handleUseAi = () => {
    setAiUsage((prev) => {
      const next = prev + 1;
      return next;
    });
  };

  const handleJoinOrganization = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      alert("Vänligen fyll i en giltig inbjudningskod.");
      return false;
    }
    const isValidPattern = trimmed.startsWith("KREATIVE-ORG-") || trimmed.length >= 6;
    if (isValidPattern) {
      setSubscription("organization");
      localStorage.setItem("kreative_subscription", "organization");
      
      const memberName = user?.displayName || "Du (Skrivet namn)";
      const memberEmail = user?.email || "din.epost@skola.se";
      
      if (!orgMembers.some(m => m.email === memberEmail)) {
        setOrgMembers(prev => [
          ...prev,
          { name: memberName, role: "Ansluten Medlem", email: memberEmail }
        ]);
      }
      alert(`Välkommen! Du har anslutit till organisationen med kod: ${trimmed}. Ditt abonnemang har uppgraderats till Organization Pack.`);
      return true;
    } else {
      alert("Ogiltig inbjudningskod. Ange en kod i formatet KREATIVE-ORG-XXXX eller liknande.");
      return false;
    }
  };

  const handleAddInviteCode = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newCode = `KREATIVE-ORG-${rand}`;
    setInviteCodes(prev => [...prev, newCode]);
    return newCode;
  };

  const handleRemoveInviteCode = (code: string) => {
    setInviteCodes(prev => prev.filter(c => c !== code));
  };

  const handleAddOrgMember = (name: string, role: string, email: string) => {
    if (!name || !email) {
      alert("Vänligen fyll i både namn och e-post.");
      return;
    }
    setOrgMembers(prev => [...prev, { name, role: role || "Elev", email }]);
  };

  const handleRemoveOrgMember = (email: string) => {
    setOrgMembers(prev => prev.filter(m => m.email !== email));
  };

  // Persistence for user projects/items
  const [items, setItems] = useState<KreativeItem[]>(() => {
    const saved = localStorage.getItem("kreative_items");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved items", e);
      }
    }
    // Return some default starter templates if nothing is saved
    return [
      {
        id: "starter-doc",
        name: "Skolprojekt: Genetik",
        type: "document",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: {
          markdown: `# Skolprojekt: Genetik & Arvsmassa\n\n**Klass:** Biologi B  \n**Skapad med:** KREATIVE AI\n\n-- *Detta är ett simulerat dokument för skolan. Skolor måste använda Organization Pack för full åtkomst.* --\n\n## 1. Vad är DNA?\nDeoxyribonukleinsyra (DNA) är det kemiska ämne som bär på den genetiska informationen (genomet) i levande organismer.\n\n## 2. Mendels lagar\nGregor Mendel la grunden för den moderna genetiken genom sina experiment med ärtväxter på 1800-talet.\n- **Dominant arv:** Ena allelen döljer effekten av den andra.\n- **Recessivt arv:** Kräver två upplagor av genen för att uttryckas.`,
        },
      },
      {
        id: "starter-page",
        name: "Min Portfölj",
        type: "page",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: {
          pageTitle: "Designbyrån Kreativ",
          metaDescription: "Vi skapar vackra landningssidor och layouter.",
          colorTheme: "modern",
          sections: [
            {
              id: "sec-p1",
              type: "hero",
              title: "Vi förverkligar dina digitala drömmar",
              subtitle: "Professionella hemsidor och digital design anpassat för företag och visionärer.",
              content: "Boka konsultation",
            },
            {
              id: "sec-p2",
              type: "features",
              title: "Vårt tjänsteutbud",
              subtitle: "Allt från layout till färdig produktkod",
              items: [
                { title: "Sajtbyggande", description: "Vi ritar och kodar responsiva webbsidor." },
                { title: "Presentationer", description: "Designar starka sälj- och investerarpitchar." },
                { title: "Innehållsskapande", description: "Välskrivna dokument och sökordsoptimering." },
              ],
            },
          ],
        },
      },
    ];
  });

  // Sync state changes to local storage
  useEffect(() => {
    localStorage.setItem("kreative_subscription", subscription);
  }, [subscription]);

  // Sync state changes to local storage ONLY when not logged in
  useEffect(() => {
    if (!user) {
      localStorage.setItem("kreative_items", JSON.stringify(items));
    }
  }, [items, user]);

  // Clean up debounced timers on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  // Fetch / load files from Google Drive
  const loadDriveItems = async (accessTokenToUse: string) => {
    setIsLoadingDrive(true);
    setDriveError(null);
    try {
      const folderId = await getOrCreateKreativeFolder(accessTokenToUse);
      setDriveFolderId(folderId);
      const filesList = await listKreativeFiles(accessTokenToUse, folderId);
      
      const loadedItems = await Promise.all(
        filesList.map(async (file) => {
          try {
            return await downloadKreativeFile(accessTokenToUse, file.id);
          } catch (e) {
            console.error(`Kunde inte ladda fil ${file.id} från Drive:`, e);
            return null;
          }
        })
      );
      
      const validItems = loadedItems.filter((it): it is KreativeItem => it !== null);
      setItems(validItems);
    } catch (err: any) {
      console.error("Fel vid laddning av Google Drive-filer:", err);
      setDriveError(err.message || "Ett fel uppstod vid laddning av Google Drive-filer.");
      if (err.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        const activeToken = accessToken || getAccessToken();
        if (activeToken) {
          setToken(activeToken);
          setAccessToken(activeToken);
          loadDriveItems(activeToken);
        } else if (currentUser) {
          // If we have a Firebase user but no GDrive token, they need to log in again to consent
          setToken(null);
        }
      },
      () => {
        setUser(null);
        setToken(null);
        setDriveFolderId(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Google Sign In action
  const handleLogin = async () => {
    try {
      setIsLoadingDrive(true);
      setDriveError(null);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        await loadDriveItems(result.accessToken);
      }
    } catch (err: any) {
      console.error("Inloggning misslyckades:", err);
      alert("Inloggning misslyckades: " + err.message);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Log out action
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setDriveFolderId(null);
    
    // Restore local storage items
    const saved = localStorage.getItem("kreative_items");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        setItems([]);
      }
    } else {
      setItems([]);
    }
  };

  // Import local files to Google Drive
  const handleImportLocalItems = async () => {
    if (!token || !driveFolderId) return;
    setIsLoadingDrive(true);
    try {
      const saved = localStorage.getItem("kreative_items");
      if (saved) {
        const localItems: KreativeItem[] = JSON.parse(saved);
        if (localItems.length > 0) {
          const uploadedItems: KreativeItem[] = [];
          for (const item of localItems) {
            const exists = items.some((it) => it.name === item.name);
            if (!exists) {
              const fileId = await createKreativeFile(token, driveFolderId, item);
              uploadedItems.push({
                ...item,
                id: fileId,
                driveFileId: fileId,
              });
            }
          }
          if (uploadedItems.length > 0) {
            setItems((prev) => [...uploadedItems, ...prev]);
            alert(`${uploadedItems.length} lokala filer har lagrats i din Google Drive!`);
          } else {
            alert("Alla lokala filer är redan överförda.");
          }
        } else {
          alert("Inga lokala filer hittades för överföring.");
        }
      }
    } catch (err: any) {
      console.error("Överföring misslyckades:", err);
      alert("Kunde inte överföra filer: " + err.message);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Handle license upgrading / switching
  const handleUpgrade = (type: SubscriptionType) => {
    setSubscription(type);
    localStorage.setItem("kreative_subscription", type);
    if (type === "office") {
      setWatermarkFreeLeft(25);
    }
    setActiveTab("dashboard");
  };

  // Create a new item (document, presentation, or webpage)
  const handleCreateItem = async (name: string, type: ItemType, templateId?: string) => {
    let initialContent: any = {};

    if (templateId) {
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        initialContent = JSON.parse(JSON.stringify(template.content));
      }
    } else {
      // Set blank content default configurations
      if (type === "document") {
        initialContent = { markdown: `# ${name}\n\nBörja skriva här...` };
      } else if (type === "presentation") {
        initialContent = {
          slides: [
            {
              id: `slide-${Date.now()}`,
              title: name,
              body: "Börja skriva din presentationspunkt här...",
              layout: "hero",
            },
          ],
        };
      } else if (type === "page") {
        initialContent = {
          pageTitle: name,
          metaDescription: "En nyskapad sida med KREATIVE.",
          colorTheme: "modern",
          sections: [
            {
              id: `sec-${Date.now()}`,
              type: "hero",
              title: name,
              subtitle: "Detta är en nyskapad landningssida sektion.",
              content: "Starta Här",
            },
          ],
        };
      } else if (type === "video") {
        initialContent = {
          scenes: [
            {
              id: `sc-${Date.now()}`,
              title: name,
              subtitle: "Detta är din första scen",
              body: "Börja skriva din scentext eller manus här. Använd AI för att generera fler scener!",
              duration: 5,
              backgroundGradient: "from-slate-950 via-slate-900 to-indigo-950",
              textColor: "text-white",
              animationType: "fade",
            },
          ],
          totalDuration: 5,
        };
      } else if (type === "story") {
        const char1Id = `char-1-${Date.now()}`;
        const char2Id = `char-2-${Date.now()}`;
        initialContent = {
          scenes: [
            {
              id: `sc-${Date.now()}`,
              duration: 6,
              background: "forest",
              characters: [
                {
                  id: char1Id,
                  type: "wizard",
                  name: "Arvid",
                  x: 30,
                  y: 65,
                  scale: 1.0,
                  facing: "right",
                  expression: "happy",
                  animation: "idle"
                },
                {
                  id: char2Id,
                  type: "robot",
                  name: "Robo-9",
                  x: 70,
                  y: 65,
                  scale: 1.0,
                  facing: "left",
                  expression: "neutral",
                  animation: "idle"
                }
              ],
              dialogues: [
                {
                  id: `diag-1-${Date.now()}`,
                  characterId: char1Id,
                  text: "Hej Robo-9! Välkommen till den magiska skogen!",
                  startTime: 1,
                  duration: 2.5,
                  bubbleType: "speech"
                },
                {
                  id: `diag-2-${Date.now()}`,
                  characterId: char2Id,
                  text: "BEEP BOOP! Mitt system detekterar höga halter magisk energi.",
                  startTime: 3.5,
                  duration: 2.5,
                  bubbleType: "speech"
                }
              ]
            }
          ],
          totalDuration: 6
        };
      }
    }

    const newItem: KreativeItem = {
      id: `item-${Date.now()}`,
      name,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: initialContent,
    };

    const currentStorage = items.reduce((acc, it) => acc + getItemSize(it), 0);
    const limit = getSubscriptionStorageLimit(subscription);
    const itemSize = getItemSize(newItem);

    if (currentStorage + itemSize > limit) {
      alert(`Kunde inte skapa projektet: Ditt lagringsutrymme skulle överskrida gränsen på ${formatBytes(limit)} för ditt nuvarande paket (${subscription === "free" ? "Free Trial" : subscription === "office" ? "Office Pack" : subscription === "organization" ? "Organization Pack" : "Business Pack"}). Ta bort några filer eller uppgradera först.`);
      return;
    }

    if (user && token && driveFolderId) {
      setIsLoadingDrive(true);
      try {
        const fileId = await createKreativeFile(token, driveFolderId, newItem);
        const itemWithDriveId: KreativeItem = {
          ...newItem,
          id: fileId,
          driveFileId: fileId,
        };
        setItems((prev) => [itemWithDriveId, ...prev]);
        setSelectedItemId(fileId);
        setActiveTab("editor");
      } catch (err: any) {
        console.error("Misslyckades att skapa fil i Google Drive:", err);
        alert("Kunde inte skapa filen i Google Drive: " + err.message);
      } finally {
        setIsLoadingDrive(false);
      }
    } else {
      setItems((prev) => [newItem, ...prev]);
      setSelectedItemId(newItem.id);
      setActiveTab("editor");
    }
  };

  const handleImportKreative = async (importedItem: KreativeItem) => {
    const currentStorage = items.reduce((acc, it) => acc + getItemSize(it), 0);
    const limit = getSubscriptionStorageLimit(subscription);
    const itemSize = getItemSize(importedItem);

    if (currentStorage + itemSize > limit) {
      alert(`Kunde inte importera projektet: Ditt lagringsutrymme skulle överskrida gränsen på ${formatBytes(limit)} för ditt nuvarande paket (${subscription === "free" ? "Free Trial" : subscription === "office" ? "Office Pack" : subscription === "organization" ? "Organization Pack" : "Business Pack"}). Ta bort några filer eller uppgradera först.`);
      return;
    }

    const importedId = `item-${Date.now()}`;
    const newItem: KreativeItem = {
      ...importedItem,
      id: importedId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      driveFileId: undefined // Needs to be clean if imported locally
    };

    if (user && token && driveFolderId) {
      setIsLoadingDrive(true);
      try {
        const fileId = await createKreativeFile(token, driveFolderId, newItem);
        const itemWithDriveId: KreativeItem = {
          ...newItem,
          id: fileId,
          driveFileId: fileId,
        };
        setItems((prev) => [itemWithDriveId, ...prev]);
        alert(`"${newItem.name}" har importerats och sparats i Google Drive!`);
      } catch (err: any) {
        console.error("Misslyckades att spara importerad fil i Google Drive:", err);
        alert("Kunde inte spara importerad fil i Google Drive: " + err.message);
      } finally {
        setIsLoadingDrive(false);
      }
    } else {
      setItems((prev) => [newItem, ...prev]);
      alert(`"${newItem.name}" har importerats lokalt!`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (user && token) {
      const itemToDelete = items.find((it) => it.id === id);
      if (itemToDelete && itemToDelete.driveFileId) {
        setIsLoadingDrive(true);
        try {
          await deleteKreativeFile(token, itemToDelete.driveFileId);
          console.log(`Deleted ${itemToDelete.name} from Google Drive`);
        } catch (err: any) {
          console.error("Misslyckades att ta bort fil från Google Drive:", err);
          alert("Kunde inte ta bort filen från Google Drive: " + err.message);
        } finally {
          setIsLoadingDrive(false);
        }
      }
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) {
      setSelectedItemId(null);
      setActiveTab("dashboard");
    }
  };

  const handleSaveItemContent = (id: string, updatedContent: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = {
            ...item,
            updatedAt: new Date().toISOString(),
            content: updatedContent,
          };

          // Save to Google Drive with 1.5s debounce to prevent API rate limiting on keypress
          if (user && token && item.driveFileId) {
            if (saveTimersRef.current[id]) {
              clearTimeout(saveTimersRef.current[id]);
            }
            saveTimersRef.current[id] = setTimeout(async () => {
              try {
                await updateKreativeFile(token, item.driveFileId!, updated);
                console.log(`Autosaved "${item.name}" to Google Drive`);
              } catch (err) {
                console.error(`Failed to autosave "${item.name}" to Google Drive:`, err);
              }
            }, 1500);
          }

          return updated;
        }
        return item;
      })
    );
  };

  const activeItem = items.find((item) => item.id === selectedItemId);

  const renderActiveTab = () => {
    if (activeTab === "pricing") {
      return (
        <PricingModule
          currentSubscription={subscription}
          onUpgrade={handleUpgrade}
          showBackToDashboard={true}
          onBack={() => setActiveTab("dashboard")}
        />
      );
    }

    if (activeTab === "editor" && activeItem) {
      switch (activeItem.type) {
        case "document":
          return (
            <DocumentEditor
              item={activeItem}
              subscription={subscription}
              watermarkFreeLeft={watermarkFreeLeft}
              onDecrementWatermarkFree={handleDecrementWatermarkFree}
              onSave={(content) => handleSaveItemContent(activeItem.id, content)}
              onBack={() => {
                setSelectedItemId(null);
                setActiveTab("dashboard");
              }}
              onRedirectToPricing={() => setActiveTab("pricing")}
              onUseAi={handleUseAi}
              aiUsage={aiUsage}
              aiLimit={aiLimit}
            />
          );
        case "presentation":
          return (
            <PresentationEditor
              item={activeItem}
              subscription={subscription}
              watermarkFreeLeft={watermarkFreeLeft}
              onDecrementWatermarkFree={handleDecrementWatermarkFree}
              onSave={(content) => handleSaveItemContent(activeItem.id, content)}
              onBack={() => {
                setSelectedItemId(null);
                setActiveTab("dashboard");
              }}
              onRedirectToPricing={() => setActiveTab("pricing")}
              onUseAi={handleUseAi}
              aiUsage={aiUsage}
              aiLimit={aiLimit}
            />
          );
        case "page":
          return (
            <PageBuilder
              item={activeItem}
              subscription={subscription}
              watermarkFreeLeft={watermarkFreeLeft}
              onDecrementWatermarkFree={handleDecrementWatermarkFree}
              onSave={(content) => handleSaveItemContent(activeItem.id, content)}
              onBack={() => {
                setSelectedItemId(null);
                setActiveTab("dashboard");
              }}
              onRedirectToPricing={() => setActiveTab("pricing")}
              onUseAi={handleUseAi}
              aiUsage={aiUsage}
              aiLimit={aiLimit}
            />
          );
        case "video":
          return (
            <VideoEditor
              item={activeItem}
              subscription={subscription}
              watermarkFreeLeft={watermarkFreeLeft}
              onDecrementWatermarkFree={handleDecrementWatermarkFree}
              onSave={(content) => handleSaveItemContent(activeItem.id, content)}
              onBack={() => {
                setSelectedItemId(null);
                setActiveTab("dashboard");
              }}
              onRedirectToPricing={() => setActiveTab("pricing")}
              onUseAi={handleUseAi}
              aiUsage={aiUsage}
              aiLimit={aiLimit}
            />
          );
        case "story":
          return (
            <StoryEditor
              item={activeItem}
              subscription={subscription}
              watermarkFreeLeft={watermarkFreeLeft}
              onDecrementWatermarkFree={handleDecrementWatermarkFree}
              onSave={(content) => handleSaveItemContent(activeItem.id, content)}
              onBack={() => {
                setSelectedItemId(null);
                setActiveTab("dashboard");
              }}
              onRedirectToPricing={() => setActiveTab("pricing")}
              onUseAi={handleUseAi}
              aiUsage={aiUsage}
              aiLimit={aiLimit}
            />
          );
        default:
          return null;
      }
    }

    // Default to Dashboard
    return (
      <Dashboard
        items={items}
        subscription={subscription}
        watermarkFreeLeft={watermarkFreeLeft}
        onCreateItem={handleCreateItem}
        onImportKreative={handleImportKreative}
        onDeleteItem={handleDeleteItem}
        onSelectItem={(id) => {
          setSelectedItemId(id);
          setActiveTab("editor");
        }}
        onNavigateToPricing={() => setActiveTab("pricing")}
        user={user}
        token={token}
        isLoadingDrive={isLoadingDrive}
        driveError={driveError}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onImportLocal={handleImportLocalItems}
        aiUsage={aiUsage}
        aiLimit={aiLimit}
        orgMembers={orgMembers}
        inviteCodes={inviteCodes}
        onJoinOrg={handleJoinOrganization}
        onAddInviteCode={handleAddInviteCode}
        onRemoveInviteCode={handleRemoveInviteCode}
        onAddOrgMember={handleAddOrgMember}
        onRemoveOrgMember={handleRemoveOrgMember}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Primary Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 select-none">
        <div className="flex items-center gap-6">
          {/* Logo brand */}
          <div
            onClick={() => {
              setSelectedItemId(null);
              setActiveTab("dashboard");
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-sm group-hover:bg-indigo-700 transition-all">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-black text-2xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-all">
                KREATIVE
              </span>
              <span className="block text-[9px] font-bold text-slate-400 font-mono tracking-widest leading-none">
                WORKSPACE
              </span>
            </div>
          </div>

          {/* Nav buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              id="nav-dash"
              onClick={() => {
                setSelectedItemId(null);
                setActiveTab("dashboard");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                activeTab === "dashboard" || (activeTab === "editor" && selectedItemId)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Instrumentpanel
            </button>
            <button
              id="nav-pricing"
              onClick={() => setActiveTab("pricing")}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                activeTab === "pricing"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Licenser & Priser
            </button>
          </div>
        </div>

        {/* User context & Quick subscription status widget */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              <Cloud className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline font-mono text-[10px] text-emerald-600">DRIVE:</span>
              <span className="font-bold max-w-[120px] truncate text-emerald-900">{user.displayName || user.email || "Inloggad"}</span>
              <button 
                onClick={handleLogout}
                className="p-1 text-emerald-600 hover:text-red-600 hover:bg-emerald-100/50 rounded-lg transition-colors cursor-pointer"
                title="Logga ut från Google Drive"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Anslut Drive</span>
            </button>
          )}

          <div
            onClick={() => setActiveTab("pricing")}
            className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition-all ${
              subscription === "free"
                ? "border-slate-200 text-slate-600"
                : subscription === "office"
                ? "border-indigo-100 bg-indigo-50/10 text-indigo-800"
                : subscription === "organization"
                ? "border-emerald-100 bg-emerald-50/10 text-emerald-800"
                : "border-purple-100 bg-purple-50/10 text-purple-800"
            }`}
          >
            {subscription === "free" && <User className="w-4 h-4 text-slate-500" />}
            {subscription === "office" && <Shield className="w-4 h-4 text-indigo-600" />}
            {subscription === "organization" && <Landmark className="w-4 h-4 text-emerald-600" />}
            {subscription === "business" && <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />}

            <div className="text-left select-none">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                Ditt paket
              </span>
              <span className="text-xs font-bold font-mono">
                {subscription === "free" && "Free Trial"}
                {subscription === "office" && "Office Pack"}
                {subscription === "organization" && "Organization Pack"}
                {subscription === "business" && "Business Pack"}
              </span>
            </div>
          </div>

          <button
            id="nav-pricing-mobile"
            onClick={() => setActiveTab("pricing")}
            className="sm:hidden px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
          >
            Licenser
          </button>
        </div>
      </nav>

      {/* Main active container view */}
      <main className="flex-1 p-4 md:p-6 bg-slate-50/50">
        {renderActiveTab()}
      </main>
    </div>
  );
}
