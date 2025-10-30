import { useState } from 'react';
import { Users, Plus, Linkedin, Mail, Phone, X, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface Connection {
  id: string;
  name: string;
  company: string;
  role: string;
  linkedinUrl?: string;
  email?: string;
  phone?: string;
  notes?: string;
  addedDate: string;
  referredJobs: string[]; // job IDs
}

export function NetworkTracker() {
  const [open, setOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>(() => {
    const saved = localStorage.getItem('network_connections');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newConnection, setNewConnection] = useState<Partial<Connection>>({
    name: '',
    company: '',
    role: '',
    linkedinUrl: '',
    email: '',
    phone: '',
    notes: '',
  });

  const handleSave = () => {
    const connection: Connection = {
      id: Date.now().toString(),
      ...newConnection as Omit<Connection, 'id' | 'addedDate' | 'referredJobs'>,
      addedDate: new Date().toISOString(),
      referredJobs: [],
    };

    const updated = [...connections, connection];
    setConnections(updated);
    localStorage.setItem('network_connections', JSON.stringify(updated));
    setIsAdding(false);
    setNewConnection({
      name: '',
      company: '',
      role: '',
      linkedinUrl: '',
      email: '',
      phone: '',
      notes: '',
    });
  };

  const handleDelete = (id: string) => {
    const updated = connections.filter(c => c.id !== id);
    setConnections(updated);
    localStorage.setItem('network_connections', JSON.stringify(updated));
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <Users className="h-4 w-4" />
        Network ({connections.length})
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Network
              </DialogTitle>
              <Button
                size="sm"
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Connection
              </Button>
            </div>
          </DialogHeader>

          <div className="py-4">
            {isAdding ? (
              <div className="space-y-4 border rounded-lg p-4">
                <h4 className="font-medium text-gray-900">New Connection</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <Input
                      value={newConnection.name}
                      onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company *
                    </label>
                    <Input
                      value={newConnection.company}
                      onChange={(e) => setNewConnection({ ...newConnection, company: e.target.value })}
                      placeholder="Google"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Their Role
                    </label>
                    <Input
                      value={newConnection.role}
                      onChange={(e) => setNewConnection({ ...newConnection, role: e.target.value })}
                      placeholder="Senior Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn URL
                    </label>
                    <Input
                      value={newConnection.linkedinUrl}
                      onChange={(e) => setNewConnection({ ...newConnection, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={newConnection.email}
                      onChange={(e) => setNewConnection({ ...newConnection, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <Input
                      value={newConnection.phone}
                      onChange={(e) => setNewConnection({ ...newConnection, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <Textarea
                    rows={3}
                    value={newConnection.notes}
                    onChange={(e) => setNewConnection({ ...newConnection, notes: e.target.value })}
                    placeholder="How you met, referral details, etc."
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={!newConnection.name || !newConnection.company}
                  >
                    Save Connection
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAdding(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : connections.length > 0 ? (
              <div className="space-y-3">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{connection.name}</h4>
                        <p className="text-sm text-gray-600">
                          {connection.role} at {connection.company}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          {connection.linkedinUrl && (
                            <a
                              href={connection.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                              <Linkedin className="h-3 w-3" />
                              LinkedIn
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {connection.email && (
                            <a
                              href={`mailto:${connection.email}`}
                              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-700"
                            >
                              <Mail className="h-3 w-3" />
                              {connection.email}
                            </a>
                          )}
                          {connection.phone && (
                            <a
                              href={`tel:${connection.phone}`}
                              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-700"
                            >
                              <Phone className="h-3 w-3" />
                              {connection.phone}
                            </a>
                          )}
                        </div>

                        {connection.notes && (
                          <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                            {connection.notes}
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                          Added {new Date(connection.addedDate).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(connection.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No connections yet</p>
                <p className="text-sm mt-1">Add people who can help with your job search</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
