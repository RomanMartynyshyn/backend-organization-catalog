INSERT INTO organizations (
    name,
    description,
    website_url,
    social_links,
    contacts,
    working_hours,
    status,
    approved_at,
    rejection_reason,
    created_at,
    updated_at
)
VALUES
    (
        'Green Future Foundation',
        'Environmental organization focused on urban tree planting and eco education programs.',
        'https://greenfuture.org',
        JSON_OBJECT(
                'email', 'info@ailearninghub.kr.ua',
                'telegram', 'https://t.me/ai_learning_hub_kr',
                'instagram', 'https://instagram.com/ailearninghub_kr',
                'linkedin', 'https://linkedin.com/company/ai-learning-hub-kr'
        ),
        JSON_ARRAY('+380671234567', '+380501112233'),
        'Mo-Fr 09:00-13:00,14:00-17:00',
        'approved',
        '2025-01-12 10:00:00',
        NULL,
        NOW(),
        NOW()
    ),
    (
        'CodeBridge Academy',
        'Educational platform providing free programming courses for teenagers and beginners.',
        'https://codebridge.dev',
        JSON_OBJECT(
                'email', 'contact@kr-urban-support.org',
                'facebook', 'https://facebook.com/krurbansupport',
                'telegram', 'https://t.me/kr_urban_support'
        ),
        JSON_ARRAY('+380671234567', '+380501112233'),
        'Mo-Fr 09:00-13:00,14:00-17:00',
        'approved',
        '2025-02-01 09:30:00',
        NULL,
        NOW(),
        NOW()
    ),
    (
        'Health First Initiative',
        'Non-profit organization supporting local healthcare access in small communities.',
        'https://healthfirst.example',
        JSON_OBJECT(
                'email', 'contact@kr-urban-initiative.org',
                'facebook', 'https://facebook.com/krurbaninitiative',
                'telegram', 'https://t.me/kr_urban_initiative'
        ),
        JSON_ARRAY('+380672223344'),
        'Mo-Sa 08:00-22:00',
        'pending',
        NULL,
        NULL,
        NOW(),
        NOW()
    ),
    (
        'Animal Rescue Network',
        'Volunteer-driven shelter and adoption network for homeless animals.',
        'https://animalrescue.net',
        JSON_OBJECT(
                'email', 'contact@kr-rescue-network.org',
                'facebook', 'https://facebook.com/krrescuenetwork',
                'telegram', 'https://t.me/kr_rescue_network'
        ),
        JSON_ARRAY('+380673334455'),
        '24/7',
        'approved',
        '2025-01-25 14:15:00',
        NULL,
        NOW(),
        NOW()
    ),
    (
        'NextGen Robotics Club',
        'Community organization promoting robotics and STEM workshops for students.',
        'https://nextgenrobotics.club',
        JSON_OBJECT(
                'email', 'contact@kr-robotics.org',
                'facebook', 'https://facebook.com/krrobotics',
                'telegram', 'https://t.me/kr_robotics'
        ),
        JSON_ARRAY('+380674445566'),
        'Mo-Sa 08:00-22:00',
        'pending',
        NULL,
        NULL,
        NOW(),
        NOW()
    ),
    (
        'City Food Bank',
        'Local food bank providing support and meal distribution for families in need.',
        'https://cityfoodbank.org',
        JSON_OBJECT(
                'email', 'contact@kr-robotics.org',
                'facebook', 'https://facebook.com/krrobotics',
                'telegram', 'https://t.me/kr_robotics'
        ),
        JSON_ARRAY('+380675556677'),
        'Mo-Fr 10:00-18:00; Sa 10:00-15:00',
        'approved',
        '2025-03-03 11:45:00',
        NULL,
        NOW(),
        NOW()
    ),
    (
        'Creative Minds Studio',
        'Art and design collective organizing workshops, exhibitions, and youth programs.',
        'https://creativeminds.studio',
        JSON_OBJECT(
                'email', 'contact@kr-minds.org',
                'facebook', 'https://facebook.com/krminds',
                'telegram', 'https://t.me/kr_minds'
        ),
        JSON_ARRAY('+380676667788'),
        'Mo-Fr 10:00-18:00; Sa 10:00-15:00',
        'rejected',
        NULL,
        'Submitted documents were incomplete and require resubmission.',
        NOW(),
        NOW()
    ),
    (
        'Digital Freedom Watch',
        'Advocacy group focused on digital rights, privacy, and internet accessibility.',
        'https://digitalfreedom.watch',
        JSON_OBJECT(
                'email', 'contact@kr-digital.org',
                'facebook', 'https://facebook.com/krdigital',
                'telegram', 'https://t.me/kr_digital'
        ),
        JSON_ARRAY('+380677778899'),
        'Mo-Sa 08:00-22:00',
        'approved',
        '2025-02-18 16:20:00',
        NULL,
        NOW(),
        NOW()
    ),
    (
        'Community Sports Alliance',
        'Organization supporting youth sports activities and local tournaments.',
        'https://sportsalliance.org',
        JSON_OBJECT(
                'email', 'contact@kr-sports.org',
                'facebook', 'https://facebook.com/krsports',
                'telegram', 'https://t.me/kr_sports'
        ),
        JSON_ARRAY('+380678889900'),
        'Mo-Sa 08:00-22:00',
        'pending',
        NULL,
        NULL,
        NOW(),
        NOW()
    ),
    (
        'Solar Energy Hub',
        'Educational and consulting center for renewable energy adoption.',
        'https://solarhub.energy',
        JSON_OBJECT(
                'email', 'contact@kr-solar.org',
                'facebook', 'https://facebook.com/krsolar',
                'telegram', 'https://t.me/kr_solar'
        ),
        JSON_ARRAY('+380679990011'),
        'Mo-Sa 08:00-22:00',
        'approved',
        '2025-04-10 08:10:00',
        NULL,
        NOW(),
        NOW()
    ),
    (
        'Women in Tech Network',
        'Professional community supporting women in software engineering and IT careers.',
        'https://womenintech.network',
        JSON_OBJECT(
                'email', 'contact@kr-women.org',
                'facebook', 'https://facebook.com/krwomen',
                'telegram', 'https://t.me/kr_women'
        ),
        JSON_ARRAY('+380671234567', '+380501112233'),
        'Mo-Sa 08:00-22:00',
        'approved',
        '2025-03-15 13:00:00',
        NULL,
        NOW(),
        NOW()
    ),
    (
        'Urban Shelter Project',
        'Organization helping provide temporary housing and rehabilitation services.',
        'https://urbanshelterproject.org',
        JSON_OBJECT(
                'email', 'contact@kr-shelter.org',
                'facebook', 'https://facebook.com/krshelter',
                'telegram', 'https://t.me/kr_shelter'
        ),
        JSON_ARRAY('+380671234567', '+380501112233'),
        'Mo-Sa 08:00-22:00',
        'rejected',
        NULL,
        'Organization verification could not be completed.',
        NOW(),
        NOW()
    );

INSERT INTO categories (name)
VALUES
    ('Education'),
    ('Healthcare'),
    ('Environment'),
    ('Technology'),
    ('Animals'),
    ('Food Support'),
    ('Arts & Culture'),
    ('Digital Rights'),
    ('Sports'),
    ('Renewable Energy'),
    ('Women Empowerment'),
    ('Housing & Shelter');


INSERT INTO organization_categories (
    organization_id,
    category_id
)
VALUES
-- Green Future Foundation
(1, 3),

-- CodeBridge Academy
(2, 1),
(2, 4),

-- Health First Initiative
(3, 2),

-- Animal Rescue Network
(4, 5),

-- NextGen Robotics Club
(5, 1),
(5, 4),

-- City Food Bank
(6, 6),

-- Creative Minds Studio
(7, 7),

-- Digital Freedom Watch
(8, 8),
(8, 4),

-- Community Sports Alliance
(9, 9),

-- Solar Energy Hub
(10, 10),
(10, 3),

-- Women in Tech Network
(11, 11),
(11, 4),
(11, 1),

-- Urban Shelter Project
(12, 12);

INSERT INTO locations (
    organization_id,
    street,
    city,
    region,
    post_code,
    latitude,
    longitude
)
VALUES
    (
        1,
        '15 Poshtovyi Ave',
        'Kryvyi Rih',
        'Dnipropetrovsk Oblast',
        '50000',
        47.9101000,
        33.3918000
    ),
    (
        2,
        '42 Heroiv ATO Street',
        'Kryvyi Rih',
        'Dnipropetrovsk Oblast',
        '50005',
        47.9145000,
        33.4012000
    ),
    (
        3,
        '8 Metalurhiv Ave',
        'Kryvyi Rih',
        'Dnipropetrovsk Oblast',
        '50027',
        47.8968000,
        33.4203000
    ),
    (
        4,
        '21 Sobornosti Street',
        'Kryvyi Rih',
        'Dnipropetrovsk Oblast',
        '50036',
        47.9214000,
        33.3821000
    ),
    (
        5,
        '10 Universytetska Street',
        'Kryvyi Rih',
        'Dnipropetrovsk Oblast',
        '50051',
        47.9387000,
        33.4324000
    ),
    (
        6,
        '33 Tsentralnyi Ave',
        'Kryvyi Rih',
        'Dnipropetrovsk Oblast',
        '50065',
        47.9019000,
        33.3765000
    ),
    (
        7,
        '12 Kobylianskoho Street',
        'Kryvyi Rih',
        'Dnipropetrovsk Oblast',
        '50071',
        47.9296000,
        33.4158000
    ),
    (
        8,
        '7 Freedom Square',
        'Kryvyi Rih',
        'Dnipropetrovsk Oblast',
        '50074',
        47.9173000,
        33.3946000
    ),
    (
        9,
        '18 Sportyvna Street',
        'Kryvyi Rih',
        'Dnipropetrovsk Oblast',
        '50079',
        47.9442000,
        33.4479000
    ),
    (
        10,
        '5 Soniachna Street',
        'Kryvyi Rih',
        'Dnipropetrovsk Oblast',
        '50082',
        47.8874000,
        33.3617000
    ),
    (
        11,
        '27 IT Park Avenue',
        'Kryvyi Rih',
        'Dnipropetrovsk Oblast',
        '50086',
        47.9251000,
        33.4055000
    ),
    (
        12,
        '9 Hromadska Street',
        'Kryvyi Rih',
        'Dnipropetrovsk Oblast',
        '50089',
        47.8986000,
        33.4381000
    );