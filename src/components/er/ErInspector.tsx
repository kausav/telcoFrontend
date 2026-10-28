import { useEffect, useState, type ReactNode } from 'react';
import type { ErModelJson, ErPlan } from '../../api/erTypes';
import { GEN_FIELD_DEFS, fieldsToGen, genToFields, hasEmptyShare, type GenFields } from '../../lib/erGenForm';
import {
  GEN_TYPES, REL_TYPES, addColumn, addEntity, addRelationship, blankRelationship, defaultGen, isFail, keyOf, readModel, relEntities, relationshipFks,
  removeColumn, removeEntity, removeRelationship, renameEntity, updateColumn, updateEntity, updateRelationship,
  type ColumnSpec, type EditResult, type EntitySpec, type ModelSpec, type RelSpec, type RelType,
} from '../../lib/erModelEdit';
import type { DiagramSelection } from './ErDiagram';

/** What the screen must tidy up after an edit worked (row counts and dragged positions are kept per table name). */
export interface EditEffect {
  renamed?: { from: string; to: string };
  removedTable?: string;
  select?: DiagramSelection;
}

interface Props {
  plan: ErPlan;
  model: ErModelJson;
  selection: DiagramSelection;
  onSelect: (selection: DiagramSelection) => void;
  /** Applies an edit to the model. Returns the reason it was refused, or null when it worked. */
  onEdit: (run: (model: ErModelJson) => EditResult, effect?: EditEffect) => string | null;
  /** What the last edit changed besides what was asked for. */
  notes: string[];
  onDismissNotes: () => void;
}

const REL_LABEL: Record<RelType, string> = {
  one_to_many: 'One to many (parent creates its children)',
  many_to_one: 'Many to one (lookup into an existing table)',
  many_to_many: 'Many to many (through a link table)',
  group: 'Group (rows of one table belong together)',
};

const input = 'w-full px-2 py-1 border border-[#E5DFD3] rounded-md bg-white text-[12.5px] text-[#29251D]';
const smallButton = 'px-2.5 py-1 rounded-md border border-[#E5DFD3] bg-white hover:bg-[#F6F2EA] text-[12px] text-[#29251D] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const primaryButton = 'px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const dangerButton = 'px-2.5 py-1 rounded-md border border-red-300 bg-white hover:bg-red-50 text-red-700 text-[12px] cursor-pointer';

export function ErInspector({ plan, model, selection, onSelect, onEdit, notes, onDismissNotes }: Props) {
  const read = readModel(model);
  const [creating, setCreating] = useState<RelType | null>(null);
  useEffect(() => setCreating(null), [selection]);

  if ('error' in read) {
    return <Panel title="Edit the model"><p className="text-[12.5px] text-red-700">{read.error}</p></Panel>;
  }
  const spec = read.spec;

  let body: ReactNode;
  if (creating) {
    body = <RelationshipForm key={`new-${creating}`} spec={spec} type={creating} existing={null} onEdit={onEdit} onCancel={() => setCreating(null)} />;
  } else if (selection?.kind === 'table' && spec.entities.some(e => e.name === selection.name)) {
    body = <TableEditor key={selection.name} spec={spec} plan={plan} model={model} name={selection.name} onEdit={onEdit} onSelect={onSelect} />;
  } else if (selection?.kind === 'relationship' && spec.relationships.some(r => r.name === selection.name)) {
    const rel = spec.relationships.find(r => r.name === selection.name) as RelSpec;
    body = <RelationshipForm key={`edit-${selection.name}`} spec={spec} type={rel.type} existing={rel} model={model} onEdit={onEdit} onCancel={() => onSelect(null)} />;
  } else {
    body = <Overview spec={spec} onEdit={onEdit} onSelect={onSelect} onNewRelationship={setCreating} />;
  }

  return (
    <div className="grid gap-2.5" data-testid="er-inspector">
      {notes.length > 0 && (
        <div className="px-2.5 py-2 rounded-lg text-[12px] bg-sky-50 text-sky-900 border border-sky-200" data-testid="er-edit-notes" role="status">
          <div className="flex items-start gap-2">
            <ul className="grid gap-0.5 flex-1 list-disc pl-4">{notes.map((note, i) => <li key={i}>{note}</li>)}</ul>
            <button type="button" className="text-sky-800 underline cursor-pointer" onClick={onDismissNotes}>Dismiss</button>
          </div>
        </div>
      )}
      {body}
    </div>
  );
}

// ---- small pieces -------------------------------------------------------------------------------------------------------
function Panel({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="border border-[#E5DFD3] rounded-xl bg-[#FBF9F4]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5DFD3]">
        <h3 className="text-[12px] uppercase tracking-wider text-[#6B6557] flex-1 truncate">{title}</h3>
        {actions}
      </div>
      <div className="p-3 grid gap-3">{children}</div>
    </section>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-0.5 text-[11px] text-[#6B6557]">
      {label}
      {children}
      {hint && <span className="text-[10.5px] text-[#8A8373]">{hint}</span>}
    </label>
  );
}

function ErrorLine({ message }: { message: string | null }) {
  return message ? <div role="alert" className="px-2 py-1.5 rounded-md bg-red-100 text-red-700 text-[12px]">{message}</div> : null;
}

/** A text box that applies its value when the user presses Enter or leaves it; a refused value is shown and the old one restored. */
function CommitInput({ label, value, onCommit, type = 'text', hint, ariaLabel }: {
  label?: string; value: string; onCommit: (value: string) => string | null; type?: 'text' | 'number'; hint?: string; ariaLabel?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft === value) return;
    const problem = onCommit(draft);
    setError(problem);
    if (problem) setDraft(value);
  };
  const box = (
    <input
      type={type}
      value={draft}
      aria-label={ariaLabel ?? label}
      className={input}
      onChange={event => { setDraft(event.target.value); setError(null); }}
      onBlur={commit}
      onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commit(); } if (event.key === 'Escape') { setDraft(value); setError(null); } }}
    />
  );
  return (
    <div className="grid gap-1">
      {label ? <Field label={label} hint={hint}>{box}</Field> : box}
      <ErrorLine message={error} />
    </div>
  );
}

/** Asks before something that removes more than the user pointed at; shows what else goes. */
function Confirm({ label, preview, onConfirm, buttonLabel }: { label: string; preview: () => EditResult; onConfirm: () => void; buttonLabel: string }) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <button type="button" className={dangerButton} onClick={() => setAsking(true)}>{buttonLabel}</button>;
  const result = preview();
  return (
    <div className="grid gap-2 p-2 rounded-md bg-red-50 border border-red-200 text-[12px] text-red-800" data-testid="er-confirm">
      <strong>{label}</strong>
      {isFail(result) ? <span>{result.error}</span> : <ul className="list-disc pl-4 grid gap-0.5">{result.notes.map((note, i) => <li key={i}>{note}</li>)}</ul>}
      <div className="flex gap-2">
        <button type="button" className={dangerButton} disabled={isFail(result)} onClick={onConfirm}>Yes, delete</button>
        <button type="button" className={smallButton} onClick={() => setAsking(false)}>Cancel</button>
      </div>
    </div>
  );
}

// ---- nothing picked -----------------------------------------------------------------------------------------------------
function Overview({ spec, onEdit, onSelect, onNewRelationship }: {
  spec: ModelSpec; onEdit: Props['onEdit']; onSelect: Props['onSelect']; onNewRelationship: (type: RelType) => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<RelType>('one_to_many');
  const add = () => {
    const clean = name.trim();
    const problem = onEdit(model => addEntity(model, clean), { select: { kind: 'table', name: clean } });
    setError(problem);
    if (!problem) setName('');
  };
  return (
    <Panel title="Edit the model">
      <p className="text-[12px] text-[#6B6557]">Click a table or a line on the diagram to change it, or add something new. Every change is written to the JSON and checked straight away.</p>
      <div className="grid gap-1.5">
        <Field label="Add a table">
          <div className="flex gap-1.5">
            <input
              className={input}
              aria-label="New table name"
              placeholder="table_name"
              value={name}
              onChange={event => { setName(event.target.value); setError(null); }}
              onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add(); } }}
            />
            <button type="button" className={primaryButton} onClick={add} disabled={name.trim() === ''}>Add table</button>
          </div>
        </Field>
        <ErrorLine message={error} />
      </div>
      <div className="grid gap-1.5">
        <Field label="Add a relationship">
          <div className="flex gap-1.5">
            <select className={input} aria-label="New relationship type" value={type} onChange={event => setType(event.target.value as RelType)}>
              {REL_TYPES.map(t => <option key={t} value={t}>{REL_LABEL[t]}</option>)}
            </select>
            <button type="button" className={primaryButton} onClick={() => onNewRelationship(type)} disabled={spec.entities.length < (type === 'group' ? 1 : 2)}>Next…</button>
          </div>
        </Field>
      </div>
      <div className="grid gap-1">
        <span className="text-[11px] text-[#6B6557]">Tables</span>
        <div className="flex flex-wrap gap-1">
          {spec.entities.map(e => <button key={e.name} type="button" className={smallButton} onClick={() => onSelect({ kind: 'table', name: e.name })}>{e.name}</button>)}
        </div>
      </div>
      <div className="grid gap-1">
        <span className="text-[11px] text-[#6B6557]">Relationships</span>
        {spec.relationships.length === 0 && <span className="text-[12px] text-[#8A8373]">None yet.</span>}
        <div className="flex flex-wrap gap-1">
          {spec.relationships.map(r => <button key={String(r.name)} type="button" className={smallButton} onClick={() => onSelect({ kind: 'relationship', name: String(r.name) })}>{String(r.name)}</button>)}
        </div>
      </div>
    </Panel>
  );
}

// ---- a table ------------------------------------------------------------------------------------------------------------
function TableEditor({ spec, plan, model, name, onEdit, onSelect }: {
  spec: ModelSpec; plan: ErPlan; model: ErModelJson; name: string; onEdit: Props['onEdit']; onSelect: Props['onSelect'];
}) {
  const entity = spec.entities.find(e => e.name === name) as EntitySpec;
  const planEntity = plan.entities.find(e => e.name === name);
  const key = keyOf(entity);
  const foreignKeys = planEntity?.columns.filter(c => c.kind === 'fk') ?? [];
  const mine = spec.relationships.filter(r => relEntities(r).includes(name));
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('choice');
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addCol = () => {
    const earlier = [...entity.columns].reverse().find(c => c.gen.type === 'date' || c.gen.type === 'date_after');
    const problem = onEdit(m => addColumn(m, name, { name: newName, gen: defaultGen(newType, earlier?.name ?? '') }));
    setError(problem);
    if (!problem) {
      setOpen(newName.trim());
      setNewName('');
    }
  };

  return (
    <Panel
      title={`Table ${name}`}
      actions={<button type="button" className={smallButton} onClick={() => onSelect(null)}>Close</button>}
    >
      <CommitInput
        label="Table name"
        value={name}
        onCommit={value => onEdit(m => renameEntity(m, name, value), { renamed: { from: name, to: value.trim() }, select: { kind: 'table', name: value.trim() } })}
      />
      {entity.count !== undefined ? (
        <CommitInput
          label="Rows"
          type="number"
          value={String(entity.count)}
          hint="How many rows this table gets, unless you set it on the left."
          onCommit={value => {
            const count = Number(value);
            if (!Number.isInteger(count)) return 'Rows must be a whole number.';
            return onEdit(m => updateEntity(m, name, { count }));
          }}
        />
      ) : (
        <p className="text-[12px] text-[#6B6557]">Rows are created from its parent{planEntity?.created_by ? ` (${planEntity.created_by})` : ''}, so there is no row count to set here.</p>
      )}
      <CommitInput label="Key column" value={key} hint="Renaming the key keeps the foreign keys in other tables as they are." onCommit={value => onEdit(m => updateEntity(m, name, { key: value }))} />

      <div className="grid gap-1.5">
        <span className="text-[11px] text-[#6B6557]">Columns</span>
        {entity.columns.map(column => (
          <ColumnRow
            key={column.name}
            entity={entity}
            column={column}
            isKey={column.name === key}
            open={open === column.name}
            onToggle={() => setOpen(open === column.name ? null : column.name)}
            onEdit={onEdit}
          />
        ))}
        {foreignKeys.map(fk => (
          <div key={fk.name} className="flex items-center gap-2 px-2 py-1 rounded-md bg-white border border-dashed border-[#D9D2C3] text-[12px] text-[#6B6557]">
            <span className="text-[9px] font-bold text-indigo-600">FK</span>
            <span className="flex-1 truncate">{fk.name}</span>
            <button type="button" className="text-[11px] underline cursor-pointer" onClick={() => fk.relationship && onSelect({ kind: 'relationship', name: fk.relationship })}>{fk.references}</button>
          </div>
        ))}
        <div className="grid gap-1 mt-1">
          <div className="flex gap-1.5">
            <input
              className={input}
              aria-label="New column name"
              placeholder="column_name"
              value={newName}
              onChange={event => { setNewName(event.target.value); setError(null); }}
              onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCol(); } }}
            />
            <select className={`${input} w-[130px]`} aria-label="New column type" value={newType} onChange={event => setNewType(event.target.value)}>
              {GEN_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
            </select>
            <button type="button" className={primaryButton} onClick={addCol} disabled={newName.trim() === ''}>Add column</button>
          </div>
          <ErrorLine message={error} />
        </div>
      </div>

      <div className="grid gap-1">
        <span className="text-[11px] text-[#6B6557]">Relationships of this table</span>
        {mine.length === 0 && <span className="text-[12px] text-[#8A8373]">None.</span>}
        <div className="flex flex-wrap gap-1">
          {mine.map(r => <button key={String(r.name)} type="button" className={smallButton} onClick={() => onSelect({ kind: 'relationship', name: String(r.name) })}>{String(r.name)}</button>)}
        </div>
      </div>

      <Confirm
        buttonLabel="Delete table"
        label={`Delete ${name}?`}
        preview={() => removeEntity(model, name)}
        onConfirm={() => { onEdit(m => removeEntity(m, name), { removedTable: name, select: null }); }}
      />
    </Panel>
  );
}

function ColumnRow({ entity, column, isKey, open, onToggle, onEdit }: {
  entity: EntitySpec; column: ColumnSpec; isKey: boolean; open: boolean; onToggle: () => void; onEdit: Props['onEdit'];
}) {
  const table = entity.name;
  return (
    <div className="rounded-md bg-white border border-[#E5DFD3]" data-column={column.name}>
      <div className="flex items-center gap-1.5 px-1.5 py-1">
        <span className="text-[9px] font-bold w-4 text-[#6B6557]">{isKey ? 'PK' : ''}</span>
        <div className="flex-1 min-w-0">
          <CommitInput ariaLabel={`Name of column ${column.name}`} value={column.name} onCommit={value => onEdit(m => updateColumn(m, table, column.name, { name: value }))} />
        </div>
        <button type="button" className={smallButton} aria-expanded={open} aria-label={`Generator of ${column.name}`} onClick={onToggle}>{column.gen.type}</button>
        {!isKey && <button type="button" className="px-1.5 text-red-700 cursor-pointer text-[15px] leading-none" aria-label={`Delete column ${column.name}`} title="Delete column" onClick={() => { onEdit(m => removeColumn(m, table, column.name)); }}>×</button>}
      </div>
      {open && <GenEditor entity={entity} column={column} isKey={isKey} onEdit={onEdit} onDone={onToggle} />}
    </div>
  );
}

function GenEditor({ entity, column, isKey, onEdit, onDone }: { entity: EntitySpec; column: ColumnSpec; isKey: boolean; onEdit: Props['onEdit']; onDone: () => void }) {
  const [type, setType] = useState(column.gen.type);
  const [fields, setFields] = useState<GenFields>(() => genToFields(column.gen));
  const [error, setError] = useState<string | null>(null);
  const above = entity.columns.slice(0, entity.columns.findIndex(c => c.name === column.name));
  const dateColumns = above.filter(c => c.gen.type === 'date' || c.gen.type === 'date_after').map(c => c.name);
  const set = (key: string, value: string) => { setFields(previous => ({ ...previous, [key]: value })); setError(null); };

  const changeType = (next: string) => {
    setType(next);
    setFields(genToFields(defaultGen(next, dateColumns[dateColumns.length - 1] ?? '')));
    setError(null);
  };
  const save = () => {
    const built = fieldsToGen(type, fields);
    if ('error' in built) {
      setError(built.error);
      return;
    }
    const problem = onEdit(m => updateColumn(m, entity.name, column.name, { gen: built.gen }));
    setError(problem);
    if (!problem) onDone();
  };

  return (
    <div className="grid gap-2 p-2 border-t border-[#E5DFD3] bg-[#FBF9F4]">
      <Field label="Generator">
        <select className={input} aria-label="Generator type" value={type} disabled={isKey} onChange={event => changeType(event.target.value)}>
          {GEN_TYPES.map(t => <option key={t.type} value={t.type}>{t.label} · {t.hint}</option>)}
        </select>
      </Field>
      {type === 'choice' && (
        <div className="grid gap-1.5">
          <Field label="How the choices are given">
            <select className={input} aria-label="Choice mode" value={fields.mode ?? 'values'} onChange={event => set('mode', event.target.value)}>
              <option value="values">A list of values (equally likely)</option>
              <option value="weights">Values with weights (label:weight)</option>
            </select>
          </Field>
          <Field label={fields.mode === 'weights' ? 'Weights, separated by commas' : 'Values, separated by commas'} hint={fields.mode === 'weights' ? 'For example retail:0.8, premium:0.2' : 'For example INR, USD'}>
            <textarea className={`${input} font-mono`} rows={2} aria-label="Choices" value={fields.list ?? ''} onChange={event => set('list', event.target.value)} />
          </Field>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {(GEN_FIELD_DEFS[type] ?? []).map(def => (
          <Field key={def.key} label={def.label}>
            {def.kind === 'column' ? (
              <select className={input} aria-label={def.label} value={fields[def.key] ?? ''} onChange={event => set(def.key, event.target.value)}>
                <option value="">— pick a date column —</option>
                {dateColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : def.kind === 'bool' ? (
              <input type="checkbox" aria-label={def.label} checked={fields[def.key] === 'true'} onChange={event => set(def.key, event.target.checked ? 'true' : 'false')} className="justify-self-start" />
            ) : (
              <input
                className={input}
                aria-label={def.label}
                type={def.kind === 'date' ? 'date' : 'text'}
                inputMode={def.kind === 'number' ? 'decimal' : undefined}
                placeholder={def.placeholder}
                value={fields[def.key] ?? ''}
                onChange={event => set(def.key, event.target.value)}
              />
            )}
          </Field>
        ))}
        {hasEmptyShare(type) && !isKey && (
          <Field label="Empty cells (0–1)">
            <input className={input} aria-label="Empty cells" inputMode="decimal" placeholder="0" value={fields.null_share ?? ''} onChange={event => set('null_share', event.target.value)} />
          </Field>
        )}
      </div>
      <ErrorLine message={error} />
      <div className="flex gap-2">
        <button type="button" className={primaryButton} onClick={save}>Save generator</button>
        <button type="button" className={smallButton} onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}

// ---- a relationship -----------------------------------------------------------------------------------------------------
type Draft = Record<string, string>;

const cardDraft = (card: unknown): [string, string] => {
  const c = (card && typeof card === 'object' ? card : {}) as { min?: unknown; max?: unknown };
  return [String(c.min ?? ''), String(c.max ?? '')];
};

/** The form's starting values. A new relationship leaves the key names empty so they follow the tables chosen; an existing one shows its own. */
function toDraft(spec: ModelSpec, rel: RelSpec, fresh: boolean): Draft {
  const [first = '', second = ''] = fresh ? [] : relationshipFks(spec, rel);
  const draft: Draft = { name: String(rel.name ?? '') };
  if (rel.type === 'many_to_many') {
    Object.assign(draft, { left: String(rel.left), right: String(rel.right), through: String(rel.through), left_fk: first, right_fk: second, cover_left: String(rel.cover_left !== false) });
    [draft.min, draft.max] = cardDraft(rel.per_right);
  } else if (rel.type === 'group') {
    Object.assign(draft, { entity: String(rel.entity), fk: first, share: String(rel.share ?? 0.2) });
    [draft.min, draft.max] = cardDraft(rel.members);
  } else {
    Object.assign(draft, { parent: String(rel.parent), child: String(rel.child), fk: first });
    if (rel.type === 'one_to_many') [draft.min, draft.max] = cardDraft(rel.children);
    else Object.assign(draft, { null_share: String(rel.null_share ?? 0), skew: String(rel.skew ?? 0) });
  }
  return draft;
}

const whole = (text: string, label: string): { value: number } | { error: string } => {
  const n = Number(text);
  return text.trim() !== '' && Number.isInteger(n) ? { value: n } : { error: `${label} must be a whole number.` };
};
const decimal = (text: string, label: string): { value: number } | { error: string } => {
  const n = Number(text);
  return text.trim() !== '' && Number.isFinite(n) ? { value: n } : { error: `${label} must be a number.` };
};

/** The relationship fields a draft describes, or what in it is not a number. */
function fromDraft(type: RelType, draft: Draft): { fields: Record<string, unknown> } | { error: string } {
  const fields: Record<string, unknown> = {};
  if (draft.name.trim()) fields.name = draft.name.trim();
  const card = (label: string): { value: { min: number; max: number } } | { error: string } => {
    const lo = whole(draft.min, `${label} minimum`);
    if ('error' in lo) return lo;
    const hi = whole(draft.max, `${label} maximum`);
    if ('error' in hi) return hi;
    return { value: { min: lo.value, max: hi.value } };
  };
  const optionalName = (key: string, value: string) => { if (value.trim()) fields[key] = value.trim(); };
  if (type === 'many_to_many') {
    Object.assign(fields, { left: draft.left, right: draft.right, through: draft.through.trim(), cover_left: draft.cover_left === 'true' });
    optionalName('left_fk', draft.left_fk);
    optionalName('right_fk', draft.right_fk);
    const c = card('Links per right row');
    if ('error' in c) return c;
    fields.per_right = c.value;
  } else if (type === 'group') {
    fields.entity = draft.entity;
    optionalName('fk', draft.fk);
    const share = decimal(draft.share, 'The share');
    if ('error' in share) return share;
    fields.share = share.value;
    const c = card('Members');
    if ('error' in c) return c;
    fields.members = c.value;
  } else {
    Object.assign(fields, { parent: draft.parent, child: draft.child });
    optionalName('fk', draft.fk);
    if (type === 'one_to_many') {
      const c = card('Children');
      if ('error' in c) return c;
      fields.children = c.value;
    } else {
      const nullShare = decimal(draft.null_share, 'The share without a parent');
      if ('error' in nullShare) return nullShare;
      const skew = decimal(draft.skew, 'Skew');
      if ('error' in skew) return skew;
      Object.assign(fields, { null_share: nullShare.value, skew: skew.value });
    }
  }
  return { fields };
}

function RelationshipForm({ spec, type, existing, model, onEdit, onCancel }: {
  spec: ModelSpec; type: RelType; existing: RelSpec | null; model?: ErModelJson; onEdit: Props['onEdit']; onCancel: () => void;
}) {
  const names = spec.entities.map(e => e.name);
  const [draft, setDraft] = useState<Draft>(() => (existing ? toDraft(spec, existing, false) : toDraft(spec, blankRelationship(type, names), true)));
  const original = existing ? toDraft(spec, existing, false) : null;
  const [error, setError] = useState<string | null>(null);
  const set = (key: string, value: string) => { setDraft(previous => ({ ...previous, [key]: value })); setError(null); };

  const table = (key: string, label: string) => (
    <Field label={label}>
      <select className={input} aria-label={label} value={draft[key]} onChange={event => set(key, event.target.value)}>
        {draft[key] === '' && <option value="">— choose a table —</option>}
        {names.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </Field>
  );
  const number = (key: string, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <input className={input} aria-label={label} inputMode="decimal" value={draft[key]} onChange={event => set(key, event.target.value)} />
    </Field>
  );
  const text = (key: string, label: string, hint?: string, list?: string) => (
    <Field label={label} hint={hint}>
      <input className={input} aria-label={label} list={list} value={draft[key]} onChange={event => set(key, event.target.value)} />
    </Field>
  );

  const save = () => {
    const built = fromDraft(type, draft);
    if ('error' in built) {
      setError(built.error);
      return;
    }
    if (existing && original) {
      // a key column the user did not touch follows a table that was changed, as it would for a new relationship
      const keyOfTable = (name: string): string => keyOf(spec.entities.find(e => e.name === name) ?? { name, columns: [] });
      const fields = built.fields;
      if ((type === 'one_to_many' || type === 'many_to_one') && draft.parent !== original.parent && draft.fk === original.fk) fields.fk = keyOfTable(draft.parent);
      if (type === 'many_to_many') {
        if (draft.left !== original.left && draft.left_fk === original.left_fk) fields.left_fk = keyOfTable(draft.left);
        if (draft.right !== original.right && draft.right_fk === original.right_fk) fields.right_fk = keyOfTable(draft.right);
      }
      if (type === 'group' && draft.entity !== original.entity && draft.fk === original.fk) fields.fk = `parent_${keyOfTable(draft.entity)}`;
      const newName = String(built.fields.name ?? existing.name);
      const problem = onEdit(m => updateRelationship(m, String(existing.name), { ...built.fields, name: newName }), { select: { kind: 'relationship', name: newName } });
      setError(problem);
      return;
    }
    const problem = onEdit(m => addRelationship(m, { ...built.fields, type } as RelSpec), { select: null });
    setError(problem);
    if (!problem) onCancel(); // back to the overview
  };

  return (
    <Panel
      title={existing ? `Relationship ${String(existing.name)}` : 'New relationship'}
      actions={<button type="button" className={smallButton} onClick={onCancel}>{existing ? 'Close' : 'Cancel'}</button>}
    >
      <p className="text-[12px] text-[#6B6557]">{REL_LABEL[type]}</p>
      {text('name', 'Relationship name', existing ? undefined : 'Optional; a name is made up if left empty.')}
      {(type === 'one_to_many' || type === 'many_to_one') && (
        <>
          {table('parent', 'Parent table')}
          {table('child', 'Child table')}
          {text('fk', 'Foreign key column in the child', existing ? undefined : "Optional; the parent's key name if left empty.")}
          {type === 'one_to_many' ? (
            <div className="grid grid-cols-2 gap-2">{number('min', 'Children per parent, at least')}{number('max', 'Children per parent, at most')}</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">{number('null_share', 'Share without a parent (0–1)')}{number('skew', 'Skew (0–2)', 'Higher = a few parents get most children')}</div>
          )}
        </>
      )}
      {type === 'many_to_many' && (
        <>
          {table('left', 'Left table')}
          {table('right', 'Right table')}
          <datalist id="er-tables">{names.map(n => <option key={n} value={n} />)}</datalist>
          {text('through', 'Link table', 'Pick a table, or type a new name to create it.', 'er-tables')}
          <div className="grid grid-cols-2 gap-2">{text('left_fk', 'Left key column')}{text('right_fk', 'Right key column')}</div>
          <div className="grid grid-cols-2 gap-2">{number('min', 'Links per right row, at least')}{number('max', 'Links per right row, at most')}</div>
          <label className="flex items-center gap-2 text-[12px] text-[#29251D]">
            <input type="checkbox" checked={draft.cover_left === 'true'} onChange={event => set('cover_left', String(event.target.checked))} />
            Every left row is linked at least once
          </label>
        </>
      )}
      {type === 'group' && (
        <>
          {table('entity', 'Table')}
          {text('fk', 'Foreign key column', existing ? undefined : 'Optional; parent_<key> if left empty.')}
          {number('share', 'Share of rows that start a group (up to 0.9)')}
          <div className="grid grid-cols-2 gap-2">{number('min', 'Members per group, at least')}{number('max', 'Members per group, at most')}</div>
        </>
      )}
      <ErrorLine message={error} />
      <div className="flex gap-2">
        <button type="button" className={primaryButton} onClick={save}>{existing ? 'Save relationship' : 'Add relationship'}</button>
      </div>
      {existing && model && (
        <Confirm
          buttonLabel="Delete relationship"
          label={`Delete ${String(existing.name)}?`}
          preview={() => removeRelationship(model, String(existing.name))}
          onConfirm={() => { onEdit(m => removeRelationship(m, String(existing.name)), { select: null }); }}
        />
      )}
    </Panel>
  );
}
