"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Download, Lock, LogIn, PlusCircle, Edit, Trash2, ChevronLeft, ChevronRight, BarChart2, DollarSign, Settings, Loader2, Clock } from 'lucide-react';
import { addClass, addRecurringClasses, deleteClass, fetchAdminData, getActiveBookingMonth, getClassCsv, getStudentCsv, setActiveBookingMonth, updateClass, updateFullBooking, getTeacherStats, fetchPacks, updateBookingStatus, addClassPack, updateClassPack, deleteClassPack, getCustomPackPrices, updateCustomPackPrices, deleteBooking } from '@/app/actions';
import type { AeroClass, Booking, ClassPack } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type ClassWithAttendees = {
    classDetails: AeroClass;
    attendees: { name: string; email: string; phone: string; }[];
}

const weekdayOptions = [
    { label: 'Domingo', value: 0 }, { label: 'Lunes', value: 1 }, { label: 'Martes', value: 2 },
    { label: 'Miércoles', value: 3 }, { label: 'Jueves', value: 4 }, { label: 'Viernes', value: 5 }, { label: 'Sábado', value: 6 },
];

const monthOptions = [
    { label: 'Enero', value: 0 }, { label: 'Febrero', value: 1 }, { label: 'Marzo', value: 2 }, { label: 'Abril', value: 3 },
    { label: 'Mayo', value: 4 }, { label: 'Junio', value: 5 }, { label: 'Julio', value: 6 }, { label: 'Agosto', value: 7 },
    { label: 'Septiembre', value: 8 }, { label: 'Octubre', value: 9 }, { label: 'Noviembre', value: 10 }, { label: 'Diciembre', value: 11 },
];

function ClassCreationForm({ onSave, onCancel }: {
    onSave: (type: 'single' | 'recurring', data: any) => void;
    onCancel: () => void;
}) {
    const [type, setType] = useState<'single' | 'recurring'>('single');
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: 'Aeroyoga', date: '', time: '', totalSpots: 7, teacher: 'Alexandra', day: 2, months: [] as number[], year: new Date().getFullYear(),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    };

    const handleMonthChange = (monthValue: number) => {
        setFormData(prev => ({ ...prev, months: prev.months.includes(monthValue) ? prev.months.filter(m => m !== monthValue) : [...prev.months, monthValue] }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { year, months, day, ...rest } = formData;
        if (type === 'single') {
            onSave('single', { ...rest, date: formData.date });
        } else {
            if (months.length === 0) {
                 toast({ variant: "destructive", title: "Error", description: "Debes seleccionar al menos un mes." });
                 return;
            }
            onSave('recurring', { ...rest, day, months, year });
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <RadioGroup onValueChange={(v) => setType(v as 'single' | 'recurring')} value={type} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="single" id="r-single" /><Label htmlFor="r-single">Clase Única</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="recurring" id="r-recurring" /><Label htmlFor="r-recurring">Clase Regular</Label></div>
            </RadioGroup>
            <Separator />
            <div className="space-y-2"><Label htmlFor="name">Nombre de la Clase</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="totalSpots">Plazas Totales</Label><Input id="totalSpots" name="totalSpots" type="number" value={formData.totalSpots} onChange={handleChange} required /></div>
                <div className="space-y-2"><Label htmlFor="teacher">Profesor/a</Label><Input id="teacher" name="teacher" value={formData.teacher} onChange={handleChange} /></div>
            </div>
            {type === 'single' ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="date">Fecha</Label><Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="time">Hora</Label><Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} required /></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Día de la Semana</Label><Select onValueChange={(v) => handleSelectChange('day', v)} defaultValue={formData.day.toString()}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{weekdayOptions.map(opt => <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="time">Hora</Label><Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} required /></div>
                    </div>
                    <div className="space-y-2">
                        <Label>Meses de Aplicación ({formData.year})</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">{monthOptions.map(month => (<div key={month.value} className="flex items-center space-x-2"><Checkbox id={`m-${month.value}`} checked={formData.months.includes(month.value)} onCheckedChange={() => handleMonthChange(month.value)} /><Label htmlFor={`m-${month.value}`} className="font-normal text-sm">{month.label}</Label></div>))}</div>
                    </div>
                </>
            )}
            <DialogFooter><Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button><Button type="submit">Guardar Clase(s)</Button></DialogFooter>
        </form>
    );
}

function EditClassForm({ classData, onSave, onCancel }: { classData: Partial<AeroClass> | null; onSave: (data: any) => void; onCancel: () => void; }) {
    const [formData, setFormData] = useState({
        name: classData?.name || 'Aeroyoga', date: classData?.date ? new Date(classData.date).toISOString().split('T')[0] : '', time: classData?.time || '', totalSpots: classData?.totalSpots || 7, teacher: classData?.teacher || 'Alexandra',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Nombre de la Clase</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="date">Fecha</Label><Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required /></div>
                <div className="space-y-2"><Label htmlFor="time">Hora</Label><Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} required /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2"><Label htmlFor="totalSpots">Plazas Totales</Label><Input id="totalSpots" name="totalSpots" type="number" value={formData.totalSpots} onChange={handleChange} required /></div>
                <div className="space-y-2"><Label htmlFor="teacher">Profesor/a</Label><Input id="teacher" name="teacher" value={formData.teacher} onChange={handleChange} /></div>
            </div>
            <DialogFooter><Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button><Button type="submit">Guardar Clase</Button></DialogFooter>
        </form>
    )
}

function EditBookingForm({ booking, allClasses, onSave, onCancel }: { booking: Booking; allClasses: AeroClass[]; onSave: (bookingId: number, updates: any) => void; onCancel: () => void; }) {
    const [student, setStudent] = useState(booking.student);
    const [price, setPrice] = useState(booking.price);
    const [packSize, setPackSize] = useState(booking.packSize);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed'>(booking.paymentStatus);
    const [selectedClassIds, setSelectedClassIds] = useState(booking.classes.map(c => c.id));
    
    const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement>) => { setStudent(prev => ({ ...prev, [e.target.name]: e.target.value })); }

    const handleClassChange = (index: number, newClassId: string) => {
        const newSelection = [...selectedClassIds];
        if (index < packSize) { newSelection[index] = newClassId; setSelectedClassIds(newSelection); }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(booking.id, { student, price, packSize, paymentStatus, classIds: selectedClassIds.slice(0, packSize).map(id => ({id})) });
    }
    
    const today = new Date(); today.setHours(0,0,0,0);
    const availableClasses = allClasses.filter(c => new Date(c.date) >= today).filter(c => (c.totalSpots - c.bookedSpots > 0) || selectedClassIds.includes(c.id));

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <DialogDescription>Editando la reserva de <span className="font-bold text-primary">{booking.student.name}</span>.</DialogDescription>
            <div className="space-y-4 border p-4 rounded-md">
                <h4 className="font-semibold text-lg">Detalles de la Alumna</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="name">Nombre</Label><Input id="name" name="name" value={student.name} onChange={handleStudentChange} /></div>
                    <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={student.email} onChange={handleStudentChange} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="phone">Teléfono</Label><Input id="phone" name="phone" value={student.phone} onChange={handleStudentChange} /></div>
                <Separator />
                <h4 className="font-semibold text-lg">Detalles del Bono y Pago</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label htmlFor="packSize">Nº de Clases (Bono)</Label><Input id="packSize" name="packSize" type="number" value={packSize} onChange={(e) => setPackSize(parseInt(e.target.value, 10))} /></div>
                    <div className="space-y-2"><Label htmlFor="price">Precio (€)</Label><Input id="price" name="price" type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} /></div>
                    <div className="space-y-2"><Label>Estado del Pago</Label><Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as 'pending'|'completed')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pendiente</SelectItem><SelectItem value="completed">Realizado</SelectItem></SelectContent></Select></div>
                </div>
            </div>
            <div className="space-y-4 border p-4 rounded-md">
                <h4 className="font-semibold text-lg">Clases Seleccionadas</h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto p-1">{Array.from({ length: packSize }).map((_, index) => (<div key={index} className="space-y-2"><Label>Clase {index + 1}</Label><Select onValueChange={(newId) => handleClassChange(index, newId)} defaultValue={selectedClassIds[index]}><SelectTrigger><SelectValue placeholder="Selecciona una clase" /></SelectTrigger><SelectContent>{availableClasses.map(cls => (<SelectItem key={cls.id} value={cls.id} disabled={selectedClassIds.includes(cls.id) && cls.id !== selectedClassIds[index]}>{cls.name} - {new Date(cls.date).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'})} {cls.time.slice(0, 5)} ({cls.totalSpots - cls.bookedSpots} libres)</SelectItem>))}</SelectContent></Select></div>))}</div>
            </div>
            <DialogFooter><Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button><Button type="submit">Guardar Cambios</Button></DialogFooter>
        </form>
    )
}

function StatisticsTab() {
    const [date, setDate] = useState(new Date());
    const [stats, setStats] = useState<Record<string, number> | null>(null);
    const { toast } = useToast();

    const fetchStats = useCallback(async (year: number, month: number) => {
        setStats(null);
        const result = await getTeacherStats(year, month);
        if (result.success) { setStats(result.stats); } 
        else { toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las estadísticas.' }); setStats({}); }
    }, [toast]);
    
    useEffect(() => { fetchStats(date.getFullYear(), date.getMonth()); }, [date, fetchStats]);

    return (
        <Card>
            <CardHeader><CardTitle>Estadísticas por Profesor</CardTitle><CardDescription>Consulta cuántas clases ha impartido cada profesor en el mes seleccionado.</CardDescription></CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-6"><h3 className="text-sm font-semibold">Seleccionar Mes:</h3><MonthNavigator date={date} onDateChange={setDate} /></div>
                {!stats ? <Skeleton className="h-24 w-full" /> : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader><TableRow><TableHead>Profesor/a</TableHead><TableHead className="text-right">Nº de Clases</TableHead></TableRow></TableHeader>
                            <TableBody>{Object.keys(stats).length > 0 ? Object.entries(stats).map(([teacher, count]) => (<TableRow key={teacher}><TableCell className="font-medium">{teacher}</TableCell><TableCell className="text-right font-bold text-lg">{count}</TableCell></TableRow>)) : (<TableRow><TableCell colSpan={2} className="text-center h-24">No hay datos para este mes.</TableCell></TableRow>)}</TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ManagePacksTab({ classPacks, onPacksUpdate }: { classPacks: ClassPack[], onPacksUpdate: () => void }) {
    const { toast } = useToast();
    const [isPackModalOpen, setIsPackModalOpen] = useState(false);
    const [editingPack, setEditingPack] = useState<ClassPack | null>(null);
    const [packToDelete, setPackToDelete] = useState<ClassPack | null>(null);
    
    const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
    const [isSavingCustom, setIsSavingCustom] = useState(false);

    useEffect(() => {
        getCustomPackPrices().then(prices => setCustomPrices(prices || {}));
    }, []);

    const handleSavePack = async (packDataFromForm: any) => {
        const isEditing = !!editingPack;
        
        let packDataWithId = { ...packDataFromForm };

        if (isEditing) {
            packDataWithId.id = editingPack!.id;
        } else {
            if (packDataFromForm.type === 'standard') {
                packDataWithId.id = packDataFromForm.classes.toString();
            } else {
                const nameSlug = packDataFromForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                packDataWithId.id = `${packDataFromForm.type}-${nameSlug}-${Date.now()}`;
            }
        }
        
        const result = isEditing 
            ? await updateClassPack(packDataWithId) 
            : await addClassPack(packDataWithId);

        if (result.success) {
            toast({ title: "¡Éxito!", description: `Bono ${isEditing ? 'actualizado' : 'creado'} correctamente.` });
            setIsPackModalOpen(false);
            setEditingPack(null);
            onPacksUpdate();
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error });
        }
    };
    
    const handleDeletePack = async () => {
        if (!packToDelete) return;
        const result = await deleteClassPack(packToDelete.id);
        if (result.success) {
            toast({ title: "Bono Eliminado" });
            setPackToDelete(null);
            onPacksUpdate();
        } else {
            toast({ variant: "destructive", title: "Error al eliminar", description: result.error });
            setPackToDelete(null);
        }
    };

    const handleCustomPriceChange = (numClasses: string, price: string) => {
        setCustomPrices(prev => ({
            ...prev,
            [numClasses]: parseFloat(price) || 0,
        }));
    };

    const handleSaveCustomPrices = async () => {
        setIsSavingCustom(true);
        const result = await updateCustomPackPrices(customPrices);
        if (result.success) {
            toast({ title: "¡Éxito!", description: "Precios de bonos personalizados actualizados." });
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error });
        }
        setIsSavingCustom(false);
    };

    const getPackTypeLabel = (type: ClassPack['type']) => {
        const labels = { standard: 'Estándar', fixed_monthly: 'Fijo Mensual' };
        return labels[type] || type;
    }

    return (
        <>
            <div className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/>Gestionar Precios Personalizados</CardTitle>
                        <CardDescription>Define el precio para cada cantidad de clases en los bonos personalizados.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-6">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                            <div key={num} className="space-y-2">
                                <Label htmlFor={`price-${num}`}>{num} {num > 1 ? 'Clases' : 'Clase'}</Label>
                                <Input
                                    id={`price-${num}`}
                                    type="number"
                                    value={customPrices[num.toString()] || ''}
                                    onChange={e => handleCustomPriceChange(num.toString(), e.target.value)}
                                    placeholder="€"
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveCustomPrices} disabled={isSavingCustom}>
                            {isSavingCustom && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Guardar Precios Personalizados
                        </Button>
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle>Gestionar Bonos Predefinidos</CardTitle>
                            <CardDescription>Añade, edita o elimina los bonos de clases disponibles.</CardDescription>
                        </div>
                        <Button onClick={() => { setEditingPack(null); setIsPackModalOpen(true);}}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Bono</Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow><TableHead>Nombre del Bono</TableHead><TableHead>Tipo</TableHead><TableHead>Clases</TableHead><TableHead>Precio</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {classPacks.map((pack) => (<TableRow key={pack.id}><TableCell className="font-medium">{pack.name}</TableCell><TableCell>{getPackTypeLabel(pack.type)}</TableCell><TableCell>{pack.type === 'standard' ? pack.classes : 'N/A'}</TableCell><TableCell>{pack.price}€</TableCell><TableCell className="text-right space-x-2"><Button variant="outline" size="icon" onClick={() => { setEditingPack(pack); setIsPackModalOpen(true); }}><Edit className="h-4 w-4" /></Button><Button variant="destructive" size="icon" onClick={() => setPackToDelete(pack)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={isPackModalOpen} onOpenChange={setIsPackModalOpen}><DialogContent><DialogHeader><DialogTitle>{editingPack ? 'Editar' : 'Crear'} Bono</DialogTitle></DialogHeader><PackForm pack={editingPack} onSave={handleSavePack} onCancel={() => setIsPackModalOpen(false)}/></DialogContent></Dialog>
            <AlertDialog open={!!packToDelete} onOpenChange={(open) => !open && setPackToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Se eliminará el bono "{packToDelete?.name}". Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setPackToDelete(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeletePack}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </>
    )
}

function PackForm({ pack, onSave, onCancel }: { pack: ClassPack | null, onSave: (data: any) => void, onCancel: () => void }) {
    const [formData, setFormData] = useState({ 
        name: pack?.name || '', 
        classes: pack?.classes || 1, 
        price: pack?.price || 0,
        type: pack?.type || 'standard' as ClassPack['type'],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
        const { name, value, type } = e.target; 
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value })); 
    };
    
    const handleTypeChange = (newType: ClassPack['type']) => {
        setFormData(prev => ({ ...prev, type: newType }));
    }

    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        onSave(formData);
    };
    
    const isEditing = !!pack;
    const isFixedType = formData.type === 'fixed_monthly';

    return (<form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
            <Label>Tipo de Bono</Label>
            <Select onValueChange={handleTypeChange} value={formData.type} disabled={isEditing}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="standard">Estándar (Nº de clases fijo)</SelectItem>
                    <SelectItem value="fixed_monthly">Fijo Mensual (Horario fijo)</SelectItem>
                </SelectContent>
            </Select>
            {isEditing && <p className="text-xs text-muted-foreground">El tipo de bono no se puede cambiar una vez creado.</p>}
        </div>

        <div className="space-y-2"><Label htmlFor="name">Nombre del Bono</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required/></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="classes">Nº de Clases</Label>
                <Input id="classes" name="classes" type="number" value={formData.classes} onChange={handleChange} required disabled={isFixedType} />
                {isFixedType && <p className="text-xs text-muted-foreground">No aplica para bonos fijos mensuales.</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="price">Precio (€)</Label>
                <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} required/>
                {isFixedType && <p className="text-xs text-muted-foreground">Esta será la cuota mensual.</p>}
            </div>
        </div>
        <DialogFooter><Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button><Button type="submit">Guardar Bono</Button></DialogFooter>
    </form>)
}

function MonthNavigator({ date, onDateChange }: { date: Date, onDateChange: (newDate: Date) => void }) {
    return (<div className="flex items-center gap-2"><Button size="icon" variant="outline" onClick={() => onDateChange(new Date(date.getFullYear(), date.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button><span className="font-bold text-base sm:text-lg text-primary w-36 sm:w-48 text-center">{date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}</span><Button size="icon" variant="outline" onClick={() => onDateChange(new Date(date.getFullYear(), date.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button></div>)
}

function AdminDashboard() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [classesWithAttendees, setClassesWithAttendees] = useState<ClassWithAttendees[]>([]);
    const [allClasses, setAllClasses] = useState<AeroClass[]>([]);
    const [classPacks, setClassPacks] = useState<ClassPack[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('students');
    const { toast } = useToast();
    
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<AeroClass | null>(null);
    const [classToDelete, setClassToDelete] = useState<AeroClass | null>(null);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
    const [activeMonth, setActiveMonth] = useState<Date | null>(null);
    const [displayDate, setDisplayDate] = useState(new Date());

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [data, month, packs] = await Promise.all([fetchAdminData(), getActiveBookingMonth(), fetchPacks()]);
            const deserialize = (item: any, dateFields: string[]) => ({ ...item, ...dateFields.reduce((acc, field) => ({ ...acc, [field]: new Date(item[field]) }), {}) });

            setBookings(data.bookings.map((b:any) => deserialize(b, ['bookingDate'])));
            setClassesWithAttendees(data.classesWithAttendees.map((c: any) => ({ ...c, classDetails: deserialize(c.classDetails, ['date']) })));
            setAllClasses(data.allClasses.map((c:any) => deserialize(c, ['date'])));
            setClassPacks(packs);
            setActiveMonth(month ? new Date(month) : null);
        } catch (error) {
            console.error("Failed to load admin data", error);
            toast({ variant: "destructive", title: "Error al cargar datos" });
        } finally { setIsLoading(false); }
    }, [toast]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleActiveMonthChange = async (offset: number | null) => {
        let newDate: Date | null = null;
        if (offset !== null) {
            newDate = activeMonth ? new Date(activeMonth.getFullYear(), activeMonth.getMonth() + offset, 1) : new Date();
        }
        const year = newDate?.getFullYear() ?? null;
        const month = newDate?.getMonth() ?? null;

        const newActiveMonth = await setActiveBookingMonth(year, month);
        setActiveMonth(newActiveMonth ? new Date(newActiveMonth) : null);
        const description = newActiveMonth ? `Ahora las alumnas reservarán para ${new Date(newActiveMonth).toLocaleString('es-ES', { month: 'long', year: 'numeric' })}.` : "Las alumnas ya no podrán realizar nuevas reservas.";
        toast({ title: "Mes actualizado", description });
    };

    const handleSaveClass = async (classFormData: any) => {
        const result = await updateClass({ ...classFormData, id: editingClass!.id, bookedSpots: editingClass!.bookedSpots });
        if (result.success) { toast({ title: "¡Éxito!", description: "Clase actualizada." }); setIsClassModalOpen(false); setEditingClass(null); loadData(); } 
        else { toast({ variant: "destructive", title: "Error", description: result.error }); }
    };

     const handleCreateClasses = async (type: 'single' | 'recurring', data: any) => {
        const result = type === 'single' ? await addClass(data) : await addRecurringClasses(data);
        if (result.success) { toast({ title: "¡Éxito!", description: `${result.classes?.length || 1} clase(s) creada(s).` }); setIsCreationModalOpen(false); loadData(); }
        else { toast({ variant: "destructive", title: "Error", description: result.error }); }
    };
    
    const handleDeleteClass = async () => {
        if (!classToDelete) return;
        const result = await deleteClass(classToDelete.id);
        if (result.success) { toast({ title: "Clase Eliminada" }); setClassToDelete(null); loadData(); }
        else { toast({ variant: "destructive", title: "Error al eliminar", description: result.error }); setClassToDelete(null); }
    };

    const handleDeleteBooking = async () => {
        if (!bookingToDelete) return;
        const result = await deleteBooking(bookingToDelete.id);
        if (result.success) {
            toast({ title: "Reserva Eliminada" });
            setBookingToDelete(null);
            loadData();
        } else {
            toast({ variant: "destructive", title: "Error al eliminar", description: result.error });
            setBookingToDelete(null);
        }
    };
    
    const handleSaveBookingChanges = async (bookingId: number, updates: any) => {
        const result = await updateFullBooking(bookingId, updates);
        if (result.success) { toast({ title: "¡Éxito!", description: "Reserva actualizada." }); setEditingBooking(null); loadData(); }
        else { toast({ variant: "destructive", title: "Error", description: result.error }); }
    };

    const handleBookingStatusChange = async (bookingId: number, status: 'pending' | 'completed') => {
        const result = await updateBookingStatus(bookingId, status);
        if (result.success) { toast({ title: "Estado del pago actualizado" }); loadData(); }
        else { toast({ variant: "destructive", title: "Error", description: result.error }); }
    }

    const handleExport = async () => {
        if (activeTab !== 'students' && activeTab !== 'classes') return;
        const csvString = activeTab === 'students' ? await getStudentCsv() : await getClassCsv();
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${activeTab}_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const filteredBookings = bookings.filter(b => {
        if (!b.classes || b.classes.length === 0) return false;
        const firstClassDate = new Date(b.classes[0].date);
        return firstClassDate.getFullYear() === displayDate.getFullYear() && firstClassDate.getMonth() === displayDate.getMonth();
    });

    const filteredClasses = classesWithAttendees.filter(cwa => {
        const classDate = new Date(cwa.classDetails.date);
        return classDate.getFullYear() === displayDate.getFullYear() && classDate.getMonth() === displayDate.getMonth();
    });

    const paymentSummary = filteredBookings.reduce((acc, booking) => {
        if (booking.paymentStatus === 'completed') acc.realizado += booking.price;
        else acc.pendiente += booking.price;
        return acc;
    }, { realizado: 0, pendiente: 0 });

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full max-w-md" /><Skeleton className="h-96 w-full" /></div>

    return (
        <>
            <Card className="mb-6">
                <CardHeader><CardTitle>Gestión de Inscripciones</CardTitle><CardDescription>Selecciona el mes en el que las alumnas pueden realizar sus reservas.</CardDescription></CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                    <h3 className="text-sm font-semibold">Mes de Reservas Activo:</h3>
                    {activeMonth ? (<div className="flex items-center gap-2"><Button size="icon" variant="outline" onClick={() => handleActiveMonthChange(-1)}><ChevronLeft className="h-4 w-4" /></Button><span className="font-bold text-lg text-primary w-40 sm:w-48 text-center">{activeMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}</span><Button size="icon" variant="outline" onClick={() => handleActiveMonthChange(1)}><ChevronRight className="h-4 w-4" /></Button></div>) : (<span className="font-bold text-lg text-destructive w-48 text-center">Inscripciones Cerradas</span>)}
                    <Button variant={activeMonth ? "destructive" : "default"} onClick={() => handleActiveMonthChange(activeMonth ? null : 0)}>{activeMonth ? "Desactivar Inscripciones" : "Activar Mes Actual"}</Button>
                </CardContent>
            </Card>

            <Tabs defaultValue="students" className="w-full" onValueChange={setActiveTab}>
                <div className="flex flex-col gap-4 mb-4">
                    <div className="w-full overflow-x-auto pb-1">
                        <TabsList className="w-full sm:w-auto">
                            <TabsTrigger value="students" className="flex-1 sm:flex-initial">Reservas</TabsTrigger>
                            <TabsTrigger value="classes" className="flex-1 sm:flex-initial">Asistencia</TabsTrigger>
                            <TabsTrigger value="manage-classes" className="flex-1 sm:flex-initial">Gestionar Clases</TabsTrigger>
                            <TabsTrigger value="manage-packs" className="flex-1 sm:flex-initial">Gestionar Bonos</TabsTrigger>
                            <TabsTrigger value="stats" className="flex-1 sm:flex-initial">Estadísticas</TabsTrigger>
                        </TabsList>
                    </div>
                    
                    {(activeTab === 'students' || activeTab === 'classes' || activeTab === 'manage-classes') && (
                        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                            <MonthNavigator date={displayDate} onDateChange={setDisplayDate} />
                            <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto" disabled={activeTab === 'manage-classes'}>
                                <Download className="mr-2 h-4 w-4" /> Exportar Vista
                            </Button>
                        </div>
                    )}
                </div>
                <TabsContent value="students">
                    <Card>
                        <CardHeader><CardTitle>Listado de Alumnas y sus Reservas</CardTitle></CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Alumna</TableHead><TableHead>Fecha Reserva</TableHead><TableHead>Bono</TableHead><TableHead>Precio</TableHead><TableHead>Estado Pago</TableHead><TableHead>Clases</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {filteredBookings.length > 0 ? filteredBookings.map(booking => (
                                            <TableRow key={booking.id}>
                                                <TableCell className="font-medium whitespace-nowrap"><div className="font-bold">{booking.student.name}</div><div className="text-sm text-muted-foreground">{booking.student.email}</div><div className="text-sm text-muted-foreground">{booking.student.phone}</div></TableCell>
                                                <TableCell className="whitespace-nowrap">{new Date(booking.bookingDate).toLocaleString('es-ES')}</TableCell>
                                                <TableCell>{booking.packSize} clases</TableCell>
                                                <TableCell>{booking.price}€</TableCell>
                                                <TableCell><Select value={booking.paymentStatus} onValueChange={(newStatus) => handleBookingStatusChange(booking.id, newStatus as 'pending'|'completed')}><SelectTrigger className={cn("min-w-[120px]", booking.paymentStatus === 'pending' && 'text-orange-500', booking.paymentStatus === 'completed' && 'text-green-600')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pendiente</SelectItem><SelectItem value="completed">Realizado</SelectItem></SelectContent></Select></TableCell>
                                                <TableCell><ul className="list-disc list-inside text-sm whitespace-nowrap">{booking.classes.map(cls => (<li key={cls.id}>{cls.name} - {new Date(cls.date).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'})} {cls.time.slice(0, 5)}</li>))}</ul></TableCell>
                                                <TableCell className="text-right space-x-2"><Button variant="outline" size="icon" onClick={() => setEditingBooking(booking)}><Edit className="h-4 w-4" /></Button><Button variant="destructive" size="icon" onClick={() => setBookingToDelete(booking)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                            </TableRow>
                                        )) : <TableRow><TableCell colSpan={7} className="text-center h-24">No hay reservas para el mes seleccionado.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col items-end gap-2 border-t pt-4 mt-4">
                            <div className="flex items-center gap-4"><p className="text-muted-foreground">Pagos Pendientes:</p><p className="font-bold text-lg">{paymentSummary.pendiente.toLocaleString('es-ES', {style:'currency', currency:'EUR'})}</p></div>
                            <div className="flex items-center gap-4"><p className="text-muted-foreground">Pagos Realizados:</p><p className="font-bold text-lg text-green-600">{paymentSummary.realizado.toLocaleString('es-ES', {style:'currency', currency:'EUR'})}</p></div>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="classes">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredClasses.length > 0 ? filteredClasses.map(({ classDetails, attendees }) => (<Card key={classDetails.id}><CardHeader><CardTitle>{classDetails.name}</CardTitle><CardDescription>{new Date(classDetails.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {classDetails.time.slice(0, 5)}<br/><span className="font-semibold">Profesora: {classDetails.teacher}</span> | Plazas: {classDetails.bookedSpots} / {classDetails.totalSpots}</CardDescription></CardHeader><CardContent><h4 className="font-semibold mb-2">Asistentes:</h4>{attendees.length > 0 ? (<ul className="list-disc list-inside text-sm">{attendees.map((attendee, index) => (<li key={`${classDetails.id}-${attendee.email}-${index}`}>{attendee.name}</li>))}</ul>) : (<p className="text-sm text-muted-foreground">No hay alumnas inscritas.</p>)}</CardContent></Card>)) : (<div className="text-center text-muted-foreground py-10 col-span-full"><p>No hay clases programadas para el mes seleccionado.</p></div>)}</div>
                </TabsContent>
                <TabsContent value="manage-classes">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div className="space-y-1"><CardTitle>Gestionar Clases</CardTitle><CardDescription>Añade, edita o elimina clases del calendario.</CardDescription></div><Button onClick={() => setIsCreationModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Clase(s)</Button></CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Clase</TableHead><TableHead>Fecha y Hora</TableHead><TableHead>Profesora</TableHead><TableHead>Plazas</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {allClasses.filter(c => { const d = new Date(c.date); return d.getFullYear() === displayDate.getFullYear() && d.getMonth() === displayDate.getMonth(); }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((classDetails) => (
                                            <TableRow key={classDetails.id}><TableCell className="font-medium whitespace-nowrap">{classDetails.name}</TableCell><TableCell className="whitespace-nowrap">{new Date(classDetails.date).toLocaleDateString('es-ES')} - {classDetails.time.slice(0, 5)}</TableCell><TableCell>{classDetails.teacher || 'N/A'}</TableCell><TableCell>{classDetails.bookedSpots} / {classDetails.totalSpots}</TableCell><TableCell className="text-right space-x-2"><Button variant="outline" size="icon" onClick={() => { setEditingClass(classDetails); setIsClassModalOpen(true);}}><Edit className="h-4 w-4" /></Button><Button variant="destructive" size="icon" onClick={() => setClassToDelete(classDetails)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="manage-packs">
                    <ManagePacksTab classPacks={classPacks} onPacksUpdate={loadData} />
                </TabsContent>
                <TabsContent value="stats">
                    <StatisticsTab />
                </TabsContent>
            </Tabs>
            
            <Dialog open={isClassModalOpen} onOpenChange={setIsClassModalOpen}><DialogContent><DialogHeader><DialogTitle>Editar Clase</DialogTitle></DialogHeader>{editingClass && <EditClassForm classData={editingClass} onSave={handleSaveClass} onCancel={() => setIsClassModalOpen(false)} />}</DialogContent></Dialog>
            <Dialog open={isCreationModalOpen} onOpenChange={setIsCreationModalOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Crear Nuevas Clases</DialogTitle><DialogDescription>Elige si quieres añadir una clase única o una clase regular para varios meses.</DialogDescription></DialogHeader><ClassCreationForm onSave={handleCreateClasses} onCancel={() => setIsCreationModalOpen(false)} /></DialogContent></Dialog>
            <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Se eliminará la clase "{classToDelete?.name}" del {classToDelete ? new Date(classToDelete.date).toLocaleDateString('es-ES') : ''}.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setClassToDelete(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteClass}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            <Dialog open={!!editingBooking} onOpenChange={(open) => !open && setEditingBooking(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Editar Reserva</DialogTitle></DialogHeader>{editingBooking && <EditBookingForm booking={editingBooking} allClasses={allClasses} onSave={handleSaveBookingChanges} onCancel={() => setEditingBooking(null)} />}</DialogContent></Dialog>
            <AlertDialog open={!!bookingToDelete} onOpenChange={(open) => !open && setBookingToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará permanentemente la reserva de "{bookingToDelete?.student.name}". Las plazas de las clases asociadas serán liberadas. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setBookingToDelete(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteBooking}>Eliminar Reserva</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </>
    );
}

export function AdminManager() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, use a secure backend authentication method.
    // This is for demonstration purposes only.
    if (password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin')) { 
      setIsAuthenticated(true); 
      setError(''); 
    }
    else { setError('Contraseña incorrecta.'); }
  };

  if (!isAuthenticated) {
    return (
        <div className="flex justify-center items-center h-[60vh] p-4">
            <Card className="w-full max-w-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><Lock /> Acceso de Administrador</CardTitle><CardDescription>Introduce la contraseña para gestionar las reservas.</CardDescription></CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                        <Button type="submit" className="w-full"><LogIn className="mr-2 h-4 w-4" /> Entrar</Button>
                    </CardContent>
                </form>
            </Card>
        </div>
    )
  }

  return <AdminDashboard />;
}
