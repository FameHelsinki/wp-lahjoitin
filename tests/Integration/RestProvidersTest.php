<?php

declare(strict_types=1);

namespace Fame\WordPress\Lahjoitukset\Tests\Integration;

use WP_REST_Request;
use WP_UnitTestCase;

final class RestProvidersTest extends WP_UnitTestCase
{
    private const ROUTE = '/fame-lahjoitukset/v1/providers';

    /**
     * Simulated lahjoitin backend: URL suffix => [response code, body array].
     *
     * @var array{code: int, body: mixed}|null
     */
    private ?array $backendResponse = null;

    /**
     * URLs requested through the WP HTTP API.
     *
     * @var string[]
     */
    private array $requestedUrls = [];

    public function set_up(): void
    {
        parent::set_up();

        add_filter('pre_http_request', function ($preempt, $args, $url) {
            $this->requestedUrls[] = $url;

            if ($this->backendResponse === null) {
                return new \WP_Error('http_request_failed', 'No backend response configured.');
            }

            return [
                'headers' => [],
                'body' => json_encode($this->backendResponse['body']),
                'response' => ['code' => $this->backendResponse['code'], 'message' => ''],
                'cookies' => [],
                'filename' => null,
            ];
        }, 10, 3);
    }

    private function request(): \WP_REST_Response
    {
        return rest_get_server()->dispatch(new WP_REST_Request('GET', self::ROUTE));
    }

    private function actAsEditor(): void
    {
        wp_set_current_user(static::factory()->user->create(['role' => 'editor']));
    }

    public function testRouteRequiresAuthentication(): void
    {
        $response = $this->request();

        $this->assertSame(401, $response->get_status());
    }

    public function testSubscriberIsForbidden(): void
    {
        wp_set_current_user(static::factory()->user->create(['role' => 'subscriber']));

        $response = $this->request();

        $this->assertSame(403, $response->get_status());
    }

    public function testReturnsEmptyListWhenSlugIsNotConfigured(): void
    {
        $this->actAsEditor();

        $response = $this->request();

        $this->assertSame(200, $response->get_status());
        $this->assertSame([], $response->get_data());
        $this->assertSame([], $this->requestedUrls, 'Backend must not be queried without a slug.');
    }

    public function testReturnsProvidersFromBackend(): void
    {
        update_option('slug', 'test-org');
        $this->backendResponse = [
            'code' => 200,
            'body' => [
                ['provider' => 'checkout', 'types' => ['single', 'recurring']],
                ['provider' => 'mobilepay', 'types' => ['single']],
            ],
        ];

        $this->actAsEditor();
        $response = $this->request();

        $this->assertSame(200, $response->get_status());
        $this->assertSame(
            [
                ['provider' => 'checkout', 'types' => ['single', 'recurring']],
                ['provider' => 'mobilepay', 'types' => ['single']],
            ],
            json_decode(json_encode($response->get_data()), true),
        );
        $this->assertSame(['https://api.lahjoitin.fi/providers/test-org'], $this->requestedUrls);
    }

    public function testProvidersAreCachedBetweenRequests(): void
    {
        update_option('slug', 'test-org');
        $this->backendResponse = [
            'code' => 200,
            'body' => [['provider' => 'checkout', 'types' => ['single']]],
        ];

        $this->actAsEditor();
        $this->request();
        $this->request();

        $this->assertCount(1, $this->requestedUrls, 'Second request must be served from the transient cache.');
    }

    public function testReturnsEmptyListWhenBackendIsUnavailable(): void
    {
        update_option('slug', 'test-org');
        $this->backendResponse = ['code' => 500, 'body' => ['error' => 'boom']];

        $this->actAsEditor();
        $response = $this->request();

        $this->assertSame(200, $response->get_status());
        $this->assertSame([], $response->get_data());
    }

    public function testReturnsEmptyListOnMalformedBackendResponse(): void
    {
        update_option('slug', 'test-org');
        $this->backendResponse = ['code' => 200, 'body' => [['no-provider-key' => true]]];

        $this->actAsEditor();
        $response = $this->request();

        $this->assertSame(200, $response->get_status());
        $this->assertSame([], $response->get_data());
    }
}
