import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, LayoutGrid, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Kanban() {
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [isBoardDialogOpen, setIsBoardDialogOpen] = useState(false);
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch boards
  const { data: boards } = trpc.kanban.listBoards.useQuery({});

  // Fetch columns for selected board
  const { data: columns } = trpc.kanban.listColumns.useQuery(
    { boardId: selectedBoardId! },
    { enabled: !!selectedBoardId }
  );

  // Fetch cards for selected board
  const { data: cards } = trpc.kanban.listCards.useQuery(
    { boardId: selectedBoardId! },
    { enabled: !!selectedBoardId }
  );

  // Fetch contacts for card dropdown
  const { data: contacts } = trpc.contacts.list.useQuery({});

  // Board mutations
  const createBoardMutation = trpc.kanban.createBoard.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban", "listBoards"] });
      toast({ title: "Board erstellt" });
      setIsBoardDialogOpen(false);
    },
  });

  const deleteBoardMutation = trpc.kanban.deleteBoard.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban", "listBoards"] });
      toast({ title: "Board gelöscht" });
      setSelectedBoardId(null);
    },
  });

  // Column mutations
  const createColumnMutation = trpc.kanban.createColumn.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban", "listColumns"] });
      toast({ title: "Spalte erstellt" });
      setIsColumnDialogOpen(false);
      setColumnForm({ name: "", color: "#3b82f6" });
    },
  });

  const updateColumnMutation = trpc.kanban.updateColumn.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban", "listColumns"] });
      toast({ title: "Spalte aktualisiert" });
      setIsColumnDialogOpen(false);
      setEditingColumn(null);
    },
  });

  const deleteColumnMutation = trpc.kanban.deleteColumn.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban", "listColumns"] });
      queryClient.invalidateQueries({ queryKey: ["kanban", "listCards"] });
      toast({ title: "Spalte gelöscht" });
    },
  });

  // Card mutations
  const createCardMutation = trpc.kanban.createCard.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban", "listCards"] });
      toast({ title: "Karte erstellt" });
      setIsCardDialogOpen(false);
      setCardForm({ columnId: 0, title: "", description: "", contactId: undefined });
    },
  });

  const moveCardMutation = trpc.kanban.moveCard.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban", "listCards"] });
    },
  });

  const deleteCardMutation = trpc.kanban.deleteCard.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban", "listCards"] });
      toast({ title: "Karte gelöscht" });
    },
  });

  const [boardForm, setBoardForm] = useState({ name: "", description: "" });
  const [columnForm, setColumnForm] = useState({ name: "", color: "#3b82f6" });
  const [cardForm, setCardForm] = useState({
    columnId: 0,
    title: "",
    description: "",
    contactId: undefined as number | undefined,
  });

  const handleCreateBoard = () => {
    createBoardMutation.mutate({
      name: boardForm.name,
      description: boardForm.description,
      module: "immobilienmakler",
    });
  };

  const handleCreateColumn = () => {
    if (!selectedBoardId) return;

    if (editingColumn) {
      updateColumnMutation.mutate({
        id: editingColumn.id,
        data: {
          name: columnForm.name,
          color: columnForm.color,
        },
      });
    } else {
      createColumnMutation.mutate({
        boardId: selectedBoardId,
        name: columnForm.name,
        color: columnForm.color,
        sortOrder: (columns?.length || 0) + 1,
      });
    }
  };

  const handleCreateCard = () => {
    if (!selectedBoardId) return;

    createCardMutation.mutate({
      boardId: selectedBoardId,
      columnId: cardForm.columnId,
      title: cardForm.title,
      description: cardForm.description,
      contactId: cardForm.contactId,
    });
  };

  const handleDeleteColumn = (id: number) => {
    if (confirm("Spalte und alle Karten darin wirklich löschen?")) {
      deleteColumnMutation.mutate({ id });
    }
  };

  const handleDeleteCard = (id: number) => {
    if (confirm("Karte wirklich löschen?")) {
      deleteCardMutation.mutate({ id });
    }
  };

  const handleEditColumn = (column: any) => {
    setEditingColumn(column);
    setColumnForm({ name: column.name, color: column.color });
    setIsColumnDialogOpen(true);
  };

  const getCardsForColumn = (columnId: number) => {
    return cards?.filter((card: any) => card.columnId === columnId) || [];
  };

  const colorPresets = [
    { name: "Blau", value: "#3b82f6" },
    { name: "Grün", value: "#10b981" },
    { name: "Gelb", value: "#f59e0b" },
    { name: "Rot", value: "#ef4444" },
    { name: "Lila", value: "#8b5cf6" },
    { name: "Grau", value: "#6b7280" },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutGrid className="h-8 w-8" />
            Kanban Boards
          </h1>
          {boards && boards.length > 0 && (
            <Select
              value={selectedBoardId?.toString() || ""}
              onValueChange={(value) => setSelectedBoardId(parseInt(value))}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Board auswählen" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board: any) => (
                  <SelectItem key={board.id} value={board.id.toString()}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Dialog open={isBoardDialogOpen} onOpenChange={setIsBoardDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neues Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Kanban Board</DialogTitle>
              <DialogDescription>Erstellen Sie ein neues Board für Ihre Deals</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="boardName">Name *</Label>
                <Input
                  id="boardName"
                  value={boardForm.name}
                  onChange={(e) => setBoardForm({ ...boardForm, name: e.target.value })}
                  placeholder="z.B. Immobilien-Leads"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boardDescription">Beschreibung</Label>
                <Textarea
                  id="boardDescription"
                  value={boardForm.description}
                  onChange={(e) => setBoardForm({ ...boardForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsBoardDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateBoard}>Erstellen</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!selectedBoardId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {boards && boards.length > 0
                ? "Wählen Sie ein Board aus oder erstellen Sie ein neues"
                : "Erstellen Sie Ihr erstes Kanban Board"}
            </p>
            <Button onClick={() => setIsBoardDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Erstes Board erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingColumn(null);
                    setColumnForm({ name: "", color: "#3b82f6" });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Spalte hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingColumn ? "Spalte bearbeiten" : "Neue Spalte"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingColumn ? "Bearbeiten Sie die Spalte" : "Fügen Sie eine neue Spalte hinzu"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="columnName">Name *</Label>
                    <Input
                      id="columnName"
                      value={columnForm.name}
                      onChange={(e) => setColumnForm({ ...columnForm, name: e.target.value })}
                      placeholder="z.B. Neuer Lead"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Farbe</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.value}
                          className={`p-4 rounded border-2 ${
                            columnForm.color === preset.value
                              ? "border-black"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: preset.value }}
                          onClick={() => setColumnForm({ ...columnForm, color: preset.value })}
                        >
                          <span className="text-white font-medium">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsColumnDialogOpen(false);
                        setEditingColumn(null);
                      }}
                    >
                      Abbrechen
                    </Button>
                    <Button onClick={handleCreateColumn}>
                      {editingColumn ? "Aktualisieren" : "Erstellen"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Board und alle Spalten/Karten wirklich löschen?")) {
                  deleteBoardMutation.mutate({ id: selectedBoardId });
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Board löschen
            </Button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns?.map((column: any) => (
              <Card
                key={column.id}
                className="min-w-[300px] flex-shrink-0"
                style={{ borderTopColor: column.color, borderTopWidth: 4 }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{column.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditColumn(column)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteColumn(column.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {getCardsForColumn(column.id).map((card: any) => {
                    const contact = contacts?.find((c: any) => c.id === card.contactId);
                    return (
                      <Card key={card.id} className="p-3 cursor-move hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{card.title}</div>
                            {card.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {card.description}
                              </div>
                            )}
                            {contact && (
                              <div className="text-xs text-muted-foreground mt-2">
                                👤 {contact.firstName} {contact.lastName}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                  <Dialog open={isCardDialogOpen && cardForm.columnId === column.id} onOpenChange={setIsCardDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setCardForm({ ...cardForm, columnId: column.id })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Karte hinzufügen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Neue Karte</DialogTitle>
                        <DialogDescription>Fügen Sie eine neue Karte hinzu</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardTitle">Titel (Kundenname) *</Label>
                          <Input
                            id="cardTitle"
                            value={cardForm.title}
                            onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                            placeholder="z.B. Max Mustermann"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardDescription">Beschreibung</Label>
                          <Textarea
                            id="cardDescription"
                            value={cardForm.description}
                            onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                            placeholder="z.B. Anfrage für Wohnung XY"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardContact">Kontakt verknüpfen</Label>
                          <Select
                            value={cardForm.contactId?.toString() || ""}
                            onValueChange={(value) =>
                              setCardForm({ ...cardForm, contactId: value ? parseInt(value) : undefined })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Kontakt auswählen (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              {contacts?.map((contact: any) => (
                                <SelectItem key={contact.id} value={contact.id.toString()}>
                                  {contact.firstName} {contact.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsCardDialogOpen(false)}>
                            Abbrechen
                          </Button>
                          <Button onClick={handleCreateCard}>Erstellen</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
