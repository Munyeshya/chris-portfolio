UPDATE organizer_accounts
SET organization_name = REPLACE(organization_name, 'Lions Entertainment', 'Lions Plus')
WHERE organization_name LIKE '%Lions Entertainment%';

UPDATE ticketing_events
SET venue = REPLACE(venue, 'Lions Entertainment', 'Lions Plus')
WHERE venue LIKE '%Lions Entertainment%';
