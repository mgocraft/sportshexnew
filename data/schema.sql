
create table if not exists witches(
  id bigserial primary key,
  name text not null,
  bio text not null,
  image_url text not null,
  price_cents int not null default 500,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists teams(
  id bigserial primary key,
  name text not null,
  league text not null
);

do $$ begin create type spell_type as enum('bless','curse'); exception when duplicate_object then null; end $$;

create table if not exists orders(
  id bigserial primary key,
  witch_id bigint references witches(id) on delete set null,
  team_id bigint references teams(id) on delete set null,
  type spell_type not null,
  status text not null default 'pending',
  paid_at timestamptz,
  result text,
  factor numeric not null default 1.0,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists marketing_contacts(
  email text primary key,
  created_at timestamptz not null default now(),
  source text not null,
  unsubscribed_at timestamptz
);

create or replace function witch_leaderboard()
returns table (witch_id bigint, name text, spells bigint, hits bigint, weighted_hits numeric, image_url text)
language sql stable as $$
  select
    w.id,
    w.name,
    count(o.*) as spells,
    count(o.*) filter (where o.result = 'hit') as hits,
    coalesce(sum(case when o.result = 'hit' then o.factor else 0 end), 0) as weighted_hits,
    w.image_url
  from witches w
  left join orders o on o.witch_id = w.id
  where w.active
  group by w.id, w.name, w.image_url
  order by weighted_hits desc nulls last, hits desc, spells desc;
$$;

insert into witches(name,bio,image_url,price_cents) values
 ('Neckbeard Mage','Once threw touchdowns, now throws hexes.','/witch-images/witch1.png',700),
 ('Auntie Hexa','Southern granny who blesses underdogs.','/witch-images/witch2.png',500),
 ('Scorigami Shaman','Blesses weird, never-seen final scores.','/witch-images/witch3.png',1000),
 ('The Turf Warlock','Turns grass into quicksand for visiting teams.','/witch-images/witch4.png',700),
 ('Ref Whisperer','Persuades whistles to swallow themselves.','/witch-images/witch5.png',600),
 ('Goalpost Gremlin','Nudges kicks just wide (or in).','/witch-images/witch6.png',700),
 ('Ice Hexecutioner','Curses hot sticks to go cold.','/witch-images/witch7.png',800),
 ('The Mascot Medium','Channels mascots for chaotic energy.','/witch-images/witch8.png',500),
 ('Fog of War Witch','Clouds opponent play-calls with confusion.','/witch-images/witch9.png',900),
 ('Bracket Banshee','Screams until seeds collapse.','/witch-images/witch10.png',500),
 ('Vegas Veil','Specializes in beating the number.','/witch-images/witch11.png',1200),
 ('Clutch Cryptid','Only appears in crunch time.','/witch-images/witch12.png',1100),
 ('Hammy Hexer','Soft-tissue specialist.','/witch-images/witch13.png',600),
 ('Turnover Toad','Slimy hands for your rivals.','/witch-images/witch14.png',500),
 ('Momentum Necromancer','Raises dead comebacks.','/witch-images/witch15.png',1000),
 ('Rain Shaman','Forecast: chance of tears.','/witch-images/witch16.png',700),
 ('Overtime Oracle','Drags games into destiny.','/witch-images/witch17.png',800),
 ('Penalty Poltergeist','Phantom flags abound.','/witch-images/witch18.png',600),
 ('Homefield Haunt','Walls vibrate, rims shrink (for visitors).','/witch-images/witch19.png',700),
 ('Lucky Llama','Actually just a llama. Strangely effective.','/witch-images/witch20.png',400)
on conflict do nothing;

insert into teams(name,league) values
 ('Chicago Bears','NFL'),('Green Bay Packers','NFL'),
 ('Detroit Red Wings','NHL'),('Chicago Cubs','MLB'),
 ('Michigan Wolverines','NCAAF'),('Ohio State Buckeyes','NCAAF')
on conflict do nothing;
